import { Router, type IRouter } from "express";
import { db, usersTable, subscriptionsTable, coursesTable, lessonsTable, resourcesTable, progressTable, announcementsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, and, or, isNull, sql } from "drizzle-orm";
import {
  UpdateUserRoleParams,
  UpdateUserRoleBody,
  UpdateMeBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, upsertUserFromClerk } from "./auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MONTHLY_PRICE = parseInt(process.env.ESEWA_MONTHLY_PRICE || "299", 10);
const YEARLY_PRICE = parseInt(process.env.ESEWA_YEARLY_PRICE || "2399", 10);

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const now = new Date();

  // Parallelise all independent DB queries
  const [totalUsers, activeSubs, totalCourses, totalLessons, totalResources] = await Promise.all([
    db.$count(usersTable),
    db
      .select()
      .from(subscriptionsTable)
      .where(
        and(
          eq(subscriptionsTable.status, "active"),
          or(isNull(subscriptionsTable.currentPeriodEnd), sql`${subscriptionsTable.currentPeriodEnd} >= ${now}`),
        ),
      ),
    db.$count(coursesTable),
    db.$count(lessonsTable),
    db.$count(resourcesTable),
  ]);

  const activeSubscriptions = activeSubs.length;

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
router.get("/admin/users", requireAdmin, async (_req, res): Promise<void> => {
  const [users, subs] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.createdAt),
    db.select().from(subscriptionsTable),
  ]);
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

// GET /admin/users/export — CSV download
// SECURITY: every export is audit-logged with the admin's ID and row count
// so that data exfiltration via a compromised admin account is detectable.
router.get("/admin/users/export", requireAdmin, async (req: any, res): Promise<void> => {
  const [users, subs] = await Promise.all([
    db.select().from(usersTable).orderBy(usersTable.createdAt),
    db.select().from(subscriptionsTable),
  ]);
  const subMap = new Map(subs.map(s => [s.userId, s]));

  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = [
    ["Name", "Email", "Role", "Subscription Status", "Plan", "Expires", "Joined"].map(escape).join(","),
    ...users.map(u => {
      const sub = subMap.get(u.clerkId);
      return [
        u.name || "",
        u.email,
        u.role,
        sub?.status || "inactive",
        sub?.plan || "none",
        sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString().split("T")[0] : "",
        new Date(u.createdAt).toISOString().split("T")[0],
      ].map(escape).join(",");
    }),
  ];

  // Audit log — fire and forget; never block the response
  db.insert(auditLogsTable)
    .values({
      adminId: req.userId,
      action: "users.export",
      targetType: "users",
      metadata: { rowCount: users.length },
    })
    .catch((err) => logger.error({ err }, "Failed to write audit log: users.export"));

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="users-${new Date().toISOString().split("T")[0]}.csv"`);
  res.send(rows.join("\n"));
});

// GET /admin/subscriptions — joined with user info
router.get("/admin/subscriptions", requireAdmin, async (_req, res): Promise<void> => {
  const [subs, users] = await Promise.all([
    db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.createdAt)),
    db.select().from(usersTable),
  ]);
  const userMap = new Map(users.map(u => [u.clerkId, u]));

  res.json(subs.map(s => ({
    ...s,
    userName: userMap.get(s.userId)?.name || null,
    userEmail: userMap.get(s.userId)?.email || null,
  })));
});

// POST /admin/subscriptions/grant — manually grant premium (atomic upsert)
router.post("/admin/subscriptions/grant", requireAdmin, async (req, res): Promise<void> => {
  const { userId, plan } = req.body as { userId: string; plan: string };
  if (!userId || !plan) { res.status(400).json({ error: "userId and plan required" }); return; }
  if (!["monthly", "yearly"].includes(plan)) { res.status(400).json({ error: "plan must be monthly or yearly" }); return; }

  const days = plan === "yearly" ? 365 : 30;
  const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db
    .insert(subscriptionsTable)
    .values({ userId, plan, status: "active", currentPeriodEnd, cancelAtPeriodEnd: false })
    .onConflictDoUpdate({
      target: subscriptionsTable.userId,
      set: { status: "active", plan, currentPeriodEnd, cancelAtPeriodEnd: false },
    });

  res.json({ success: true });
});

// DELETE /admin/subscriptions/:userId/revoke — revoke premium
router.delete("/admin/subscriptions/:userId/revoke", requireAdmin, async (req, res): Promise<void> => {
  const { userId } = req.params;
  await db.update(subscriptionsTable)
    .set({ status: "inactive", plan: "none" })
    .where(eq(subscriptionsTable.userId, userId));
  res.json({ success: true });
});

// GET /admin/enrollment-stats — course enrollments from progress table
router.get("/admin/enrollment-stats", requireAdmin, async (_req, res): Promise<void> => {
  const [courses, progress] = await Promise.all([
    db.select().from(coursesTable).orderBy(coursesTable.title),
    db.select().from(progressTable),
  ]);

  const courseEnrollees = new Map<number, Set<string>>();
  const courseCompletions = new Map<number, number>();

  for (const p of progress) {
    if (!courseEnrollees.has(p.courseId)) courseEnrollees.set(p.courseId, new Set());
    courseEnrollees.get(p.courseId)!.add(p.userId);
    if (p.completed) {
      courseCompletions.set(p.courseId, (courseCompletions.get(p.courseId) ?? 0) + 1);
    }
  }

  const result = courses
    .map(c => ({
      courseId: c.id,
      title: c.title,
      enrollments: courseEnrollees.get(c.id)?.size ?? 0,
      lessonsCompleted: courseCompletions.get(c.id) ?? 0,
      isPublished: c.isPublished,
    }))
    .sort((a, b) => b.enrollments - a.enrollments);

  res.json(result);
});

// GET /admin/activity — recent platform activity
router.get("/admin/activity", requireAdmin, async (_req, res): Promise<void> => {
  const [users, subs] = await Promise.all([
    db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(15),
    db.select().from(subscriptionsTable).orderBy(desc(subscriptionsTable.updatedAt)).limit(15),
  ]);
  const userMap = new Map(users.map(u => [u.clerkId, u]));

  const events = [
    ...users.map(u => ({
      type: "user_joined" as const,
      icon: "user",
      description: `${u.name || u.email} joined`,
      detail: u.email,
      at: u.createdAt,
    })),
    ...subs.map(s => ({
      type: "subscription" as const,
      icon: "subscription",
      description: `${userMap.get(s.userId)?.name || s.userId} — subscription ${s.status}`,
      detail: `${s.plan} plan`,
      at: s.updatedAt,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 25);

  res.json(events);
});

// PATCH /admin/users/:clerkId/role
router.patch("/admin/users/:clerkId/role", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateUserRoleParams.safeParse({ clerkId: req.params.clerkId });
  if (!params.success) { res.status(400).json({ error: "Invalid clerkId" }); return; }
  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.clerkId, params.data.clerkId))
    .returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Audit log role change — fire and forget
  db.insert(auditLogsTable)
    .values({
      adminId: (req as any).userId,
      action: "users.role_change",
      targetType: "user",
      targetId: params.data.clerkId,
      metadata: { newRole: parsed.data.role },
    })
    .catch((err) => logger.error({ err }, "Failed to write audit log: users.role_change"));

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, user.clerkId));
  res.json({
    clerkId: user.clerkId, email: user.email, name: user.name, role: user.role,
    subscriptionStatus: sub?.status ?? null, subscriptionPlan: sub?.plan ?? null, createdAt: user.createdAt,
  });
});

// --- Announcements ---

router.get("/admin/announcements", requireAdmin, async (_req, res): Promise<void> => {
  const announcements = await db.select().from(announcementsTable).orderBy(desc(announcementsTable.createdAt));
  res.json(announcements);
});

router.post("/admin/announcements", requireAdmin, async (req, res): Promise<void> => {
  const { message, type = "info" } = req.body as { message: string; type?: string };
  if (!message?.trim()) { res.status(400).json({ error: "message required" }); return; }
  const [announcement] = await db.insert(announcementsTable).values({ message: message.trim(), type }).returning();
  res.json(announcement);
});

router.patch("/admin/announcements/:id", requireAdmin, async (req, res): Promise<void> => {
  const { isActive } = req.body as { isActive: boolean };
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [announcement] = await db.update(announcementsTable).set({ isActive }).where(eq(announcementsTable.id, id)).returning();
  if (!announcement) { res.status(404).json({ error: "Not found" }); return; }
  res.json(announcement);
});

router.delete("/admin/announcements/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(announcementsTable).where(eq(announcementsTable.id, id));
  res.json({ success: true });
});

// --- User profile ---

router.get("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  let [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, req.userId));
  if (!user) {
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

router.patch("/users/me", requireAuth, async (req: any, res): Promise<void> => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.clerkId, req.userId)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId));
  res.json({ ...user, subscription: sub ?? null });
});

export default router;
