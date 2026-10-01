import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

// ── Timing-safe password compare ─────────────────────────────────────────────

// Pre-computed dummy hash — ensures non-existent user lookups take the same
// time as real password checks, preventing user-enumeration via timing.
const DUMMY_HASH = "$2a$12$abcdefghijklmnopqrstuvwxyz012345678901234567890123456";

export async function timingSafeCompare(
  password: string,
  realHash: string | null | undefined,
): Promise<boolean> {
  if (!realHash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, realHash);
}

// ── Password strength ─────────────────────────────────────────────────────────

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "12345678",
  "qwerty", "abc123", "letmein", "welcome", "monkey", "dragon",
  "master", "sunshine", "princess", "shadow", "superman",
]);

export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, reason: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long" };
  }
  if (password.length > 128) {
    return { valid: false, reason: "Password must not exceed 128 characters" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one letter" };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one number or special character" };
  }
  // Require at least one lowercase letter to prevent all-caps passwords
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter" };
  }
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { valid: false, reason: "That password is too common — please choose a stronger one" };
  }
  return { valid: true };
}

// ── Brute-force protection ─────────────────────────────────────────────────────

interface FailedAttemptRecord {
  count: number;
  lockedUntil: number;
  firstAttemptAt: number;
}

const failedAttempts = new Map<string, FailedAttemptRecord>();

// Stricter limits: 5 attempts before 15-minute lockout
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
// Progressive lockout: after 10+ attempts in a session, lockout doubles
const EXTENDED_LOCKOUT_MS = 60 * 60 * 1000; // 1 hour

// Admin brute-force: stricter — 3 attempts before 1-hour lockout
const ADMIN_MAX_ATTEMPTS = 3;
const ADMIN_LOCKOUT_MS = 60 * 60 * 1000;

export function checkBruteForce(
  identifier: string,
  isAdmin = false,
): { locked: boolean; remainingMs?: number } {
  const record = failedAttempts.get(identifier);
  if (!record) return { locked: false };

  const now = Date.now();
  if (record.lockedUntil > now) {
    return { locked: true, remainingMs: record.lockedUntil - now };
  }

  const maxAttempts = isAdmin ? ADMIN_MAX_ATTEMPTS : MAX_ATTEMPTS;
  if (record.lockedUntil <= now && record.count >= maxAttempts) {
    failedAttempts.delete(identifier);
    return { locked: false };
  }

  return { locked: false };
}

export function recordFailedAttempt(identifier: string, isAdmin = false): void {
  const now = Date.now();
  const record = failedAttempts.get(identifier) ?? {
    count: 0,
    lockedUntil: 0,
    firstAttemptAt: now,
  };

  record.count += 1;
  const maxAttempts = isAdmin ? ADMIN_MAX_ATTEMPTS : MAX_ATTEMPTS;
  const lockMs = isAdmin
    ? ADMIN_LOCKOUT_MS
    : record.count >= maxAttempts * 2
      ? EXTENDED_LOCKOUT_MS
      : LOCKOUT_DURATION_MS;

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockMs;
  }
  failedAttempts.set(identifier, record);
}

export function recordSuccessfulAttempt(identifier: string): void {
  failedAttempts.delete(identifier);
}

// ── Security headers middleware ───────────────────────────────────────────────

export function enhancedSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY"); // Upgraded: was SAMEORIGIN
  res.setHeader("X-XSS-Protection", "0"); // Modern browsers: let CSP handle it
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
}

// ── Input sanitization ────────────────────────────────────────────────────────

export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Strip raw angular brackets (stored XSS)
    .replace(/javascript:/gi, "") // Strip JS protocol
    .replace(/on\w+\s*=/gi, ""); // Strip inline event handlers
}

// ── Admin-specific brute-force check helpers ──────────────────────────────────

export function checkAdminBruteForce(identifier: string) {
  return checkBruteForce(identifier, true);
}

export function recordAdminFailedAttempt(identifier: string) {
  return recordFailedAttempt(identifier, true);
}

// ── Cleanup stale records every 30 minutes ────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of failedAttempts.entries()) {
    if (record.lockedUntil > 0 && record.lockedUntil < now) {
      failedAttempts.delete(key);
    }
  }
}, 30 * 60 * 1000);
