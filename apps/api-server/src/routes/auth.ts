import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, subscriptionsTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isDisposableEmail } from "../lib/disposableEmails";
import { verifySupabaseToken, isSupabaseServerConfigured } from "../lib/supabase";
import {
  timingSafeCompare,
  validatePasswordStrength,
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  sanitizeString,
} from "../middleware/security";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "learnhub-local-dev-secret-key-change-in-prod-2026";
const TOKEN_EXPIRY = "30d";

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies JWT from Bearer header or auth cookie.
 * Supports both native JWTs and Supabase access tokens.
 */
export function safeGetAuth(req: any): { userId: string; email?: string; role?: string; sessionClaims?: { userId: string } } | null {
  if (req._cachedAuth) return req._cachedAuth;

  let token: string | undefined;

  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token && req.cookies?.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) return null;

  // 1. Try native JWT
  const decoded = verifyToken(token);
  if (decoded && decoded.userId) {
    const authData = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionClaims: { userId: decoded.userId },
    };
    req._cachedAuth = authData;
    return authData;
  }

  // If token is not native JWT, it may be an asynchronous Supabase token;
  // Supabase sync endpoint handles syncing it to a native cookie.
  return null;
}

export const requireAuth = (req: any, res: any, next: any): void => {
  const auth = safeGetAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized — please sign in" });
    return;
  }
  req.userId = userId as string;
  next();
};

export const requireAdmin = async (req: any, res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId as string;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId as string));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden — admin access required" });
    return;
  }
  next();
};

export const requireActiveSubscription = async (req: any, res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId as string;
  const [sub] = await db.select().from(subscriptionsTable).where(
    eq(subscriptionsTable.userId, userId as string)
  );
  const isExpired = sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();
  if (!sub || sub.status !== "active" || isExpired) {
    res.status(403).json({ error: "Active subscription required" });
    return;
  }
  next();
};

export async function upsertUserFromClerk(_userId: string): Promise<void> {
  // Legacy stub
}

export const ensureUser = async (req: any, res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  if (auth?.userId) {
    req.userId = auth.userId;
  }
  next();
};

function formatUserResponse(user: User) {
  return {
    id: user.clerkId,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    role: user.role,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

// ── Auth Endpoints ────────────────────────────────────────────────────────────

// POST /auth/register
router.post("/auth/register", async (req: any, res): Promise<void> => {
  try {
    const { email, password, name } = req.body || {};

    if (!email || typeof email !== "string" || !email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required" });
      return;
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      res.status(400).json({ error: strength.reason });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = sanitizeString((name && typeof name === "string") ? name : cleanEmail.split("@")[0]);

    if (isDisposableEmail(cleanEmail)) {
      res.status(400).json({ error: "Sign-ups with temporary or disposable emails are not allowed" });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail));

    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // First user automatically gets admin role
    const totalUsers = await db.$count(usersTable);
    const role = totalUsers === 0 ? "admin" : "user";

    const [newUser] = await db
      .insert(usersTable)
      .values({
        clerkId: userId,
        email: cleanEmail,
        passwordHash,
        name: cleanName,
        role,
      })
      .returning();

    const token = signToken({
      userId: newUser.clerkId,
      email: newUser.email,
      role: newUser.role,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: formatUserResponse(newUser),
      token,
    });
  } catch (err: any) {
    req.log?.error?.({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed — please try again" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req: any, res): Promise<void> => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown_ip";
  const { email, password } = req.body || {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Brute force defense checks
  const ipLock = checkBruteForce(`ip_${ip}`);
  if (ipLock.locked) {
    const mins = Math.ceil((ipLock.remainingMs || 0) / 60000);
    res.status(429).json({ error: `Too many failed attempts from your connection. Please wait ${mins} minutes.` });
    return;
  }

  const emailLock = checkBruteForce(`email_${cleanEmail}`);
  if (emailLock.locked) {
    const mins = Math.ceil((emailLock.remainingMs || 0) / 60000);
    res.status(429).json({ error: `Too many failed attempts for this account. Please wait ${mins} minutes.` });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail));

    // Constant-time check to prevent timing attack enumeration
    const isMatch = await timingSafeCompare(password, user?.passwordHash);

    if (!user || !user.passwordHash || !isMatch) {
      recordFailedAttempt(`ip_${ip}`);
      recordFailedAttempt(`email_${cleanEmail}`);
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Success — clear failed attempts
    recordSuccessfulAttempt(`ip_${ip}`);
    recordSuccessfulAttempt(`email_${cleanEmail}`);

    const token = signToken({
      userId: user.clerkId,
      email: user.email,
      role: user.role,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: formatUserResponse(user),
      token,
    });
  } catch (err: any) {
    req.log?.error?.({ err }, "Login error");
    res.status(500).json({ error: "Login failed — please try again" });
  }
});

// POST /auth/supabase-sync
// Synchronizes a verified Supabase authentication session into the local database
router.post("/auth/supabase-sync", async (req: any, res): Promise<void> => {
  try {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== "string") {
      res.status(400).json({ error: "Access token is required" });
      return;
    }

    const sbUser = await verifySupabaseToken(accessToken);
    if (!sbUser || !sbUser.id || !sbUser.email) {
      res.status(401).json({ error: "Invalid or expired Supabase token" });
      return;
    }

    const cleanEmail = sbUser.email.trim().toLowerCase();
    const rawName = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || cleanEmail.split("@")[0];
    const cleanName = sanitizeString(rawName);
    const avatarUrl = sbUser.user_metadata?.avatar_url || null;

    // Check if user exists by Supabase ID or by email
    let [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, sbUser.id));

    if (!existingUser) {
      const [userByEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, cleanEmail));

      if (userByEmail) {
        existingUser = userByEmail;
      }
    }

    let user: User;

    if (!existingUser) {
      const totalUsers = await db.$count(usersTable);
      const role = totalUsers === 0 ? "admin" : "user";

      const [created] = await db
        .insert(usersTable)
        .values({
          clerkId: sbUser.id,
          email: cleanEmail,
          name: cleanName,
          role,
          avatarUrl,
        })
        .returning();

      user = created;
    } else {
      // Update profile info if changed
      const [updated] = await db
        .update(usersTable)
        .set({
          name: cleanName || existingUser.name,
          avatarUrl: avatarUrl || existingUser.avatarUrl,
        })
        .where(eq(usersTable.clerkId, existingUser.clerkId))
        .returning();

      user = updated;
    }

    const token = signToken({
      userId: user.clerkId,
      email: user.email,
      role: user.role,
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: formatUserResponse(user),
      token,
    });
  } catch (err: any) {
    req.log?.error?.({ err }, "Supabase sync error");
    res.status(500).json({ error: "Failed to synchronize Supabase session" });
  }
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req: any, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, req.userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, req.userId));

  res.json({
    ...formatUserResponse(user),
    subscription: sub ?? null,
  });
});

export default router;
