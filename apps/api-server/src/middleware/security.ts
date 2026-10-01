import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";

// Pre-computed dummy hash to mitigate timing attacks on nonexistent user lookups
const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456";

/**
 * Performs a constant-time comparison even if the target user was not found
 */
export async function timingSafeCompare(password: string, realHash: string | null | undefined): Promise<boolean> {
  if (!realHash) {
    await bcrypt.compare(password, DUMMY_HASH);
    return false;
  }
  return bcrypt.compare(password, realHash);
}

/**
 * Validates password complexity:
 * - At least 8 characters
 * - At least 1 letter
 * - At least 1 number or symbol
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, reason: "Password is required" };
  }
  if (password.length < 8) {
    return { valid: false, reason: "Password must be at least 8 characters long" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one letter" };
  }
  if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one number or special character" };
  }
  return { valid: true };
}

interface FailedAttemptRecord {
  count: number;
  lockedUntil: number;
}

// In-memory brute force tracker (cleared on restart)
const failedAttempts = new Map<string, FailedAttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkBruteForce(identifier: string): { locked: boolean; remainingMs?: number } {
  const record = failedAttempts.get(identifier);
  if (!record) return { locked: false };

  const now = Date.now();
  if (record.lockedUntil > now) {
    return { locked: true, remainingMs: record.lockedUntil - now };
  }

  // Lock expired, reset
  if (record.lockedUntil <= now && record.count >= MAX_ATTEMPTS) {
    failedAttempts.delete(identifier);
    return { locked: false };
  }

  return { locked: false };
}

export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const record = failedAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  failedAttempts.set(identifier, record);
}

export function recordSuccessfulAttempt(identifier: string): void {
  failedAttempts.delete(identifier);
}

/**
 * Middleware that attaches best-practice security headers to every response
 */
export function enhancedSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
}

/**
 * Sanitizes input string to prevent stored XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, ""); // Strip raw angular brackets
}
