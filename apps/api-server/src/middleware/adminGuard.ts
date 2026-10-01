/**
 * adminGuard.ts — Multi-layer admin protection middleware
 *
 * Every /admin/* route passes through THREE independent checks:
 *   1. Valid JWT (requireAuth base check)
 *   2. Role verified LIVE from the database (not just from the token)
 *   3. Token age check — tokens older than 4 hours are rejected for admin ops
 *
 * This means:
 *  - A stolen/leaked token can only do admin things for max 4 hours
 *  - A demoted admin loses access immediately (DB check, not cached in JWT)
 *  - Every admin action is audit-logged with IP + user agent
 */

import type { Request, Response, NextFunction } from "express";
import { db, usersTable, auditLogsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { safeGetAuth, verifyToken } from "../routes/auth";
import { logger } from "../lib/logger";
import {
  checkAdminBruteForce,
  recordAdminFailedAttempt,
  recordSuccessfulAttempt,
} from "./security";

// Maximum age of a JWT token allowed for admin operations (4 hours)
const ADMIN_TOKEN_MAX_AGE_SECONDS = 4 * 60 * 60;

/**
 * Extracts the raw JWT string from the request (header or cookie)
 */
function getRawToken(req: Request): string | null {
  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookies = (req as any).cookies;
  if (cookies?.auth_token) return cookies.auth_token;
  return null;
}

/**
 * requireAdminStrict — 3-layer admin guard
 *
 * Use this on ALL /admin/* routes instead of requireAdmin.
 */
export async function requireAdminStrict(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
  const userAgent = req.headers["user-agent"] ?? "unknown";

  // ── Layer 1: Brute-force guard on admin endpoints ─────────────────────────
  const ipLock = checkAdminBruteForce(`admin_ip_${ip}`);
  if (ipLock.locked) {
    const mins = Math.ceil((ipLock.remainingMs ?? 0) / 60000);
    res.status(429).json({
      error: `Too many admin access attempts from your connection. Locked for ${mins} more minutes.`,
    });
    return;
  }

  // ── Layer 2: JWT authentication ───────────────────────────────────────────
  const auth = safeGetAuth(req as any);
  if (!auth?.userId) {
    recordAdminFailedAttempt(`admin_ip_${ip}`);
    res.status(401).json({ error: "Unauthorized — authentication required" });
    return;
  }

  // ── Layer 3: Token age check — reject tokens older than 4 hours ───────────
  const rawToken = getRawToken(req);
  if (rawToken) {
    const decoded = verifyToken(rawToken);
    if (decoded) {
      const payload = decoded as any;
      const issuedAt: number | undefined = payload.iat;
      if (issuedAt) {
        const ageSeconds = Math.floor(Date.now() / 1000) - issuedAt;
        if (ageSeconds > ADMIN_TOKEN_MAX_AGE_SECONDS) {
          res.status(401).json({
            error: "Admin session expired — please log in again to access the admin panel",
            code: "ADMIN_TOKEN_EXPIRED",
          });
          return;
        }
      }
    }
  }

  // ── Layer 4: Live database role verification ──────────────────────────────
  // We do NOT trust the role in the JWT for admin ops — always check the DB.
  let dbUser: { role: string; clerkId: string; email: string } | undefined;
  try {
    const [found] = await db
      .select({ role: usersTable.role, clerkId: usersTable.clerkId, email: usersTable.email })
      .from(usersTable)
      .where(eq(usersTable.clerkId, auth.userId));
    dbUser = found;
  } catch (err) {
    logger.error({ err }, "Admin guard: DB lookup failed");
    res.status(500).json({ error: "Authorization check failed" });
    return;
  }

  if (!dbUser) {
    recordAdminFailedAttempt(`admin_ip_${ip}`);
    res.status(401).json({ error: "Unauthorized — user not found" });
    return;
  }

  if (dbUser.role !== "admin") {
    recordAdminFailedAttempt(`admin_ip_${ip}`);
    logger.warn(
      { userId: auth.userId, email: dbUser.email, ip, userAgent, path: req.path },
      "Admin access denied — insufficient role",
    );
    // Deliberately vague: don't tell attackers why they were denied
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  // ── All checks passed ─────────────────────────────────────────────────────
  recordSuccessfulAttempt(`admin_ip_${ip}`);

  // Attach admin context to request
  (req as any).userId = auth.userId;
  (req as any).adminEmail = dbUser.email;

  // Audit log every admin request (fire-and-forget — never block the request)
  db.insert(auditLogsTable)
    .values({
      adminId: auth.userId,
      action: `admin.request.${req.method.toLowerCase()}`,
      targetType: "endpoint",
      targetId: req.path,
      metadata: {
        ip,
        userAgent,
        query: Object.keys(req.query).length > 0 ? req.query : undefined,
      },
    })
    .catch((err) => logger.error({ err }, "Admin guard: audit log write failed"));

  next();
}

/**
 * Logs a specific admin action to the audit log.
 * Use this for high-impact operations like role changes, data exports, etc.
 */
export async function auditLog(
  adminId: string,
  action: string,
  targetType: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      adminId,
      action,
      targetType,
      targetId,
      metadata,
    });
  } catch (err) {
    logger.error({ err, action }, "Failed to write audit log");
  }
}
