import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

export const requireAuth = (req: any, res: any, next: any): void => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId as string;
  next();
};

export const requireAdmin = async (req: any, res: any, next: any): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId as string;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId as string));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
};

export const requireActiveSubscription = async (req: any, res: any, next: any): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId as string;
  const { subscriptionsTable } = await import("@workspace/db");
  const { eq: eqSub, and } = await import("drizzle-orm");
  const [sub] = await db.select().from(subscriptionsTable).where(
    eqSub(subscriptionsTable.userId, userId as string)
  );
  if (!sub || sub.status !== "active") {
    res.status(403).json({ error: "Active subscription required" });
    return;
  }
  next();
};

/**
 * Fetches the full user record from Clerk's API and upserts it into the DB.
 * Used as a fallback when the webhook hasn't fired yet (e.g. dev mode or
 * the webhook is not yet configured).
 */
export async function upsertUserFromClerk(clerkId: string): Promise<void> {
  const { clerkClient } = await import("@clerk/express");
  const clerkUser = await clerkClient.users.getUser(clerkId);

  const email =
    clerkUser.emailAddresses.find(
      (e: { id: string; emailAddress: string }) =>
        e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ?? "";

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    "";

  const avatarUrl = clerkUser.imageUrl || null;

  await db
    .insert(usersTable)
    .values({ clerkId, email, name, avatarUrl })
    .onConflictDoUpdate({
      target: usersTable.clerkId,
      set: { email, name, avatarUrl },
    });
}

/**
 * Middleware that ensures the authenticated user has a row in the DB.
 * Runs on every authenticated request — creates the row on first visit by
 * pulling full profile data from Clerk's API (name, email, avatar).
 * The Clerk webhook keeps data in sync after that.
 */
export const ensureUser = async (req: any, res: any, next: any): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.sessionClaims?.userId || auth?.userId;
  if (!userId) { next(); return; }
  req.userId = userId as string;

  try {
    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.clerkId, userId as string));

    if (!existing) {
      try {
        await upsertUserFromClerk(userId as string);
      } catch {
        // Fallback: create a minimal row so the request can proceed
        await db
          .insert(usersTable)
          .values({ clerkId: userId as string, email: "", name: "" })
          .onConflictDoNothing();
      }
    }
  } catch (err) {
    // DB unavailable or schema not yet migrated — req.userId is already set so
    // public routes still work. Authenticated routes that need DB will fail on
    // their own queries with a clear error.
    req.log.warn({ err, userId }, "ensureUser: DB lookup failed, continuing without user sync");
  }

  next();
};

export default router;
