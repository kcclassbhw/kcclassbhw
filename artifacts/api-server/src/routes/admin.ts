import { Router, type IRouter } from "express";
import { db, usersTable, subscriptionsTable, coursesTable, lessonsTable, resourcesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  UpdateUserRoleParams,
  UpdateUserRoleBody,
  UpdateMeBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, upsertUserFromClerk } from "./auth";

const router: IRouter = Router();

const MONTHLY_PRICE = parseInt(process.env.ESEWA_MONTHLY_PRICE || "299", 10);
const YEARLY_PRICE = parseInt(process.env.ESEWA_YEARLY_PRICE || "2399", 10);

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const totalUsers = await db.$count(usersTable);
  const activeSubs = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
  const activeSubscriptions = activeSubs.length;
  const totalCourses = await db.$count(coursesTable);
  const totalLessons = await db.$count(lessonsTable);
  const totalResources = await db.$count(resourcesTable);

  const monthlyRevenue = activeSubs.reduce((sum, s) => {
    if (s.plan === "yearly") return sum + Math.round(YEARLY_PRICE / 12);
    return sum + MONTHLY_PRICE;
  }, 0);

  res.json({
    totalUsers,
    activeSubscriptions,
    totalCourses,
    totalLessons,
    totalResources,
    monthlyRevenue,
  });
});

// GET /admin/users
router.get("/admin/users", requireAdmin, async (req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const subs = await db.select().from(subscriptionsTable);
  const subMap = new Map(subs.map(s => [s.userId, s]));

  res.json(users.map(u => ({
    clerkId: u.clerkId,
    email: u.email,
    name: u.name,
    role: u.role,
    subscriptionStatus: subMap.get(u.clerkId)?.status ?? null,
    subscriptionPlan: subMap.get(u.clerkId)?.plan ?? null,
    createdAt: u.createdAt,
  })));
});

// GET /admin/subscriptions — joined with user info
router.get("/admin/subscriptions", requireAdmin, async (req, res): Promise<void> => {
  const subs = await db.select().from(subscriptionsTable);
  const users = await db.select().from(usersTable);
  const userMap = new Map(users.map(u => [u.clerkId, u]));

  res.json(subs.map(s => ({
    ...s,
    userName: userMap.get(s.userId)?.name || null,
    userEmail: userMap.get(s.userId)?.email || null,
  })));
});

// PATCH /admin/users/:clerkId/role
router.patch("/admin/users/:clerkId/role", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserRoleParams.safeParse({ clerkId: req.params.clerkId });
  if (!params.success) { res.status(400).json({ error: "Invalid clerkId" }); return; }
  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set({ role: parsed.data.role }).where(eq(usersTable.clerkId, params.data.clerkId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.clerkId));
  res.json({
    clerkId: user.clerkId, email: user.email, name: user.name, role: user.role,
    subscriptionStatus: sub?.status ?? null, subscriptionPlan: sub?.plan ?? null, createdAt: user.createdAt,
  });
});

// GET /users/me
router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
  if (!user) {
    // Fetch full profile from Clerk and create the DB row
    try {
      await upsertUserFromClerk(req.userId);
    } catch {
      await db.insert(usersTable).values({ clerkId: req.userId, email: "", name: "" }).onConflictDoNothing();
    }
    [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
  }
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId));
  res.json({ ...user, subscription: sub ?? null });
});

// PATCH /users/me
router.patch("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.clerkId, req.userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId));
  res.json({ ...user, subscription: sub ?? null });
});

export default router;
