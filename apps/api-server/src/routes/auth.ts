import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, usersTable, subscriptionsTable, type User } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isDisposableEmail } from "../lib/disposableEmails";
import { verifySupabaseToken } from "../lib/supabase";
import {
  timingSafeCompare,
  validatePasswordStrength,
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  sanitizeString,
} from "../middleware/security";

const router: IRouter = Router();

// ── Token configuration ────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET must be set in production");
}
const SECRET = JWT_SECRET ?? "kcclassbhw-local-dev-secret-CHANGE-IN-PROD";

// Short-lived access token (15 minutes) — keeps blast radius small on leaks
const ACCESS_TOKEN_EXPIRY = "15m";
// Long-lived refresh token (30 days) — only sent via httpOnly cookie
const REFRESH_TOKEN_EXPIRY = "30d";
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  type: "access" | "refresh";
}

export function signToken(payload: Omit<AuthPayload, "type">): string {
  return jwt.sign({ ...payload, type: "access" }, SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(payload: Omit<AuthPayload, "type">): string {
  return jwt.sign({ ...payload, type: "refresh" }, SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setAccessCookie(res: any, token: string): void {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: "/",
  });
}

function setRefreshCookie(res: any, token: string): void {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: "/api/auth/refresh", // Refresh cookie ONLY sent to refresh endpoint
  });
}

function clearAuthCookies(res: any): void {
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" as const : "lax" as const,
  };
  res.clearCookie("auth_token", cookieOpts);
  res.clearCookie("refresh_token", { ...cookieOpts, path: "/api/auth/refresh" });
}

// ── Auth extraction & middleware ──────────────────────────────────────────────

/**
 * Extracts and verifies JWT from Bearer header or auth cookie.
 * Only accepts access tokens (type: "access").
 */
export function safeGetAuth(req: any): {
  userId: string;
  email?: string;
  role?: string;
  sessionClaims?: { userId: string };
} | null {
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

  const decoded = verifyToken(token);
  // Only accept access tokens here — reject refresh tokens used as access tokens
  if (!decoded || decoded.type !== "access" || !decoded.userId) return null;

  const authData = {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role,
    sessionClaims: { userId: decoded.userId },
  };
  req._cachedAuth = authData;
  return authData;
}

export const requireAuth = (req: any, res: any, next: any): void => {
  const auth = safeGetAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized — please sign in" });
    return;
  }
  req.userId = auth.userId;
  next();
};

export const requireAdmin = async (req: any, res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, auth.userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

export const requireActiveSubscription = async (req: any, res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = auth.userId;
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, auth.userId));
  const isExpired = sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();
  if (!sub || sub.status !== "active" || isExpired) {
    res.status(403).json({ error: "Active subscription required" });
    return;
  }
  next();
};

export async function upsertUserFromClerk(_userId: string): Promise<void> {
  // Legacy stub — kept for backward compat
}

export const ensureUser = async (req: any, _res: any, next: any): Promise<void> => {
  const auth = safeGetAuth(req);
  if (auth?.userId) req.userId = auth.userId;
  next();
};

// ── Response formatter ────────────────────────────────────────────────────────

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

// ══════════════════════════════════════════════════════════════════════════════
// Auth Endpoints
// ══════════════════════════════════════════════════════════════════════════════

// POST /auth/register
router.post("/auth/register", async (req: any, res): Promise<void> => {
  try {
    const { email, password, name } = req.body ?? {};

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
    const cleanName = sanitizeString(
      name && typeof name === "string" ? name : cleanEmail.split("@")[0],
    );

    if (isDisposableEmail(cleanEmail)) {
      res.status(400).json({
        error: "Sign-ups with temporary or disposable emails are not allowed",
      });
      return;
    }

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail));

    if (existing) {
      // Don't leak whether account exists — use generic message
      res.status(400).json({ error: "Registration failed — please check your details" });
      return;
    }

    // Use bcrypt cost factor 12 for production-strength hashing
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = `usr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;

    // First user automatically gets admin role
    const totalUsers = await db.$count(usersTable);
    const role = totalUsers === 0 ? "admin" : "user";

    const [newUser] = await db
      .insert(usersTable)
      .values({ clerkId: userId, email: cleanEmail, passwordHash, name: cleanName, role })
      .returning();

    const tokenPayload = { userId: newUser.clerkId, email: newUser.email, role: newUser.role };
    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    setAccessCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({ user: formatUserResponse(newUser), token: accessToken });
  } catch (err: any) {
    req.log?.error?.({ err }, "Registration error");
    res.status(500).json({ error: "Registration failed — please try again" });
  }
});

// POST /auth/login
router.post("/auth/login", async (req: any, res): Promise<void> => {
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown_ip";
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  // Brute-force defense
  const ipLock = checkBruteForce(`ip_${ip}`);
  if (ipLock.locked) {
    const mins = Math.ceil((ipLock.remainingMs ?? 0) / 60000);
    res
      .status(429)
      .json({ error: `Too many failed attempts. Please wait ${mins} minutes.` });
    return;
  }

  const emailLock = checkBruteForce(`email_${cleanEmail}`);
  if (emailLock.locked) {
    const mins = Math.ceil((emailLock.remainingMs ?? 0) / 60000);
    res
      .status(429)
      .json({ error: `Account temporarily locked. Please wait ${mins} minutes.` });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, cleanEmail));

    // Constant-time check — prevents timing-attack enumeration
    const isMatch = await timingSafeCompare(password, user?.passwordHash);

    if (!user || !user.passwordHash || !isMatch) {
      recordFailedAttempt(`ip_${ip}`);
      recordFailedAttempt(`email_${cleanEmail}`);
      // Generic message — don't confirm whether email exists
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    recordSuccessfulAttempt(`ip_${ip}`);
    recordSuccessfulAttempt(`email_${cleanEmail}`);

    const tokenPayload = { userId: user.clerkId, email: user.email, role: user.role };
    const accessToken = signToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    setAccessCookie(res, accessToken);
    setRefreshCookie(res, refreshToken);

    res.json({ user: formatUserResponse(user), token: accessToken });
  } catch (err: any) {
    req.log?.error?.({ err }, "Login error");
    res.status(500).json({ error: "Login failed — please try again" });
  }
});

// POST /auth/refresh — silently renew access token using refresh cookie
router.post("/auth/refresh", (req: any, res): void => {
  const rawRefresh = req.cookies?.refresh_token;
  if (!rawRefresh) {
    res.status(401).json({ error: "No refresh token — please log in again" });
    return;
  }

  const decoded = verifyToken(rawRefresh);
  if (!decoded || decoded.type !== "refresh" || !decoded.userId) {
    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    res.status(401).json({ error: "Invalid refresh token — please log in again" });
    return;
  }

  const tokenPayload = { userId: decoded.userId, email: decoded.email, role: decoded.role };
  const newAccessToken = signToken(tokenPayload);
  setAccessCookie(res, newAccessToken);

  res.json({ token: newAccessToken });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  clearAuthCookies(res);
  res.json({ success: true });
});

// POST /auth/change-password — authenticated users can update their password
router.post("/auth/change-password", requireAuth, async (req: any, res): Promise<void> => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }

  const strength = validatePasswordStrength(newPassword);
  if (!strength.valid) {
    res.status(400).json({ error: strength.reason });
    return;
  }

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, req.userId));

    if (!user?.passwordHash) {
      res.status(400).json({ error: "Cannot change password for this account type" });
      return;
    }

    const isMatch = await timingSafeCompare(currentPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({ error: "New password must be different from your current password" });
      return;
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(usersTable)
      .set({ passwordHash: newHash })
      .where(eq(usersTable.clerkId, req.userId));

    // Invalidate all sessions by clearing cookies
    clearAuthCookies(res);
    res.json({ success: true, message: "Password updated — please log in again" });
  } catch (err: any) {
    req.log?.error?.({ err }, "Change password error");
    res.status(500).json({ error: "Password change failed — please try again" });
  }
});

// POST /auth/supabase-sync — sync a verified Supabase OAuth session
router.post("/auth/supabase-sync", async (req: any, res): Promise<void> => {
  try {
    const { accessToken } = req.body ?? {};
    if (!accessToken || typeof accessToken !== "string") {
      res.status(400).json({ error: "Access token is required" });
      return;
    }

    const sbUser = await verifySupabaseToken(accessToken);
    if (!sbUser?.id || !sbUser.email) {
      res.status(401).json({ error: "Invalid or expired Supabase token" });
      return;
    }

    const cleanEmail = sbUser.email.trim().toLowerCase();
    const rawName =
      sbUser.user_metadata?.full_name ??
      sbUser.user_metadata?.name ??
      cleanEmail.split("@")[0];
    const cleanName = sanitizeString(rawName);
    const avatarUrl = sbUser.user_metadata?.avatar_url ?? null;

    let [existingUser] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, sbUser.id));

    if (!existingUser) {
      const [userByEmail] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, cleanEmail));
      if (userByEmail) existingUser = userByEmail;
    }

    let user: User;

    if (!existingUser) {
      const totalUsers = await db.$count(usersTable);
      const role = totalUsers === 0 ? "admin" : "user";
      const [created] = await db
        .insert(usersTable)
        .values({ clerkId: sbUser.id, email: cleanEmail, name: cleanName, role, avatarUrl })
        .returning();
      user = created;
    } else {
      const [updated] = await db
        .update(usersTable)
        .set({
          name: cleanName || existingUser.name,
          avatarUrl: avatarUrl ?? existingUser.avatarUrl,
        })
        .where(eq(usersTable.clerkId, existingUser.clerkId))
        .returning();
      user = updated;
    }

    const tokenPayload = { userId: user.clerkId, email: user.email, role: user.role };
    const newAccessToken = signToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    setAccessCookie(res, newAccessToken);
    setRefreshCookie(res, newRefreshToken);

    res.json({ user: formatUserResponse(user), token: newAccessToken });
  } catch (err: any) {
    req.log?.error?.({ err }, "Supabase sync error");
    res.status(500).json({ error: "Failed to synchronize Supabase session" });
  }
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

  res.json({ ...formatUserResponse(user), subscription: sub ?? null });
});

export default router;
