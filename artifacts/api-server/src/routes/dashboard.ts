import { Router, type IRouter } from "express";
import { db, coursesTable, lessonsTable, progressTable, subscriptionsTable, downloadsTable, resourcesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "./auth";

const router: IRouter = Router();

// GET /dashboard/summary
router.get("/dashboard/summary", requireAuth, async (req: any, res): Promise<void> => {
  // Run all independent queries in parallel instead of sequentially
  const [sub, progress, totalLessons, totalCourses, totalDownloads] = await Promise.all([
    db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, req.userId)).then(r => r[0] ?? null),
    db.select().from(progressTable).where(eq(progressTable.userId, req.userId)),
    db.$count(lessonsTable, eq(lessonsTable.isPublished, true)),
    db.$count(coursesTable, eq(coursesTable.isPublished, true)),
    db.$count(downloadsTable, eq(downloadsTable.userId, req.userId)),
  ]);

  const completedLessons = progress.filter(p => p.completed).length;
  const enrolledCourses = new Set(progress.map(p => p.courseId)).size;

  const isSubActive =
    sub?.status === "active" &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) >= new Date());

  res.json({
    totalCourses,
    completedLessons,
    totalLessons,
    enrolledCourses,
    activeSubscription: isSubActive,
    totalDownloads,
    subscriptionPlan: sub?.plan ?? null,
    subscriptionEnd: sub?.currentPeriodEnd?.toISOString() ?? null,
  });
});

// GET /dashboard/continue-watching
router.get("/dashboard/continue-watching", requireAuth, async (req: any, res): Promise<void> => {
  const records = await db
    .select({
      lessonId: progressTable.lessonId,
      courseId: progressTable.courseId,
      completed: progressTable.completed,
      lastAccessedAt: progressTable.lastAccessedAt,
      lessonTitle: lessonsTable.title,
      courseTitle: coursesTable.title,
      courseThumbnailUrl: coursesTable.thumbnailUrl,
    })
    .from(progressTable)
    .innerJoin(lessonsTable, eq(lessonsTable.id, progressTable.lessonId))
    .innerJoin(coursesTable, eq(coursesTable.id, progressTable.courseId))
    .where(eq(progressTable.userId, req.userId))
    .orderBy(desc(progressTable.lastAccessedAt))
    .limit(6);

  res.json(records);
});

// GET /dashboard/download-history
router.get("/dashboard/download-history", requireAuth, async (req: any, res): Promise<void> => {
  const records = await db
    .select({
      id: downloadsTable.id,
      resourceId: downloadsTable.resourceId,
      userId: downloadsTable.userId,
      resourceTitle: resourcesTable.title,
      downloadedAt: downloadsTable.downloadedAt,
    })
    .from(downloadsTable)
    .innerJoin(resourcesTable, eq(resourcesTable.id, downloadsTable.resourceId))
    .where(eq(downloadsTable.userId, req.userId))
    .orderBy(desc(downloadsTable.downloadedAt))
    .limit(20);

  res.json(records);
});

export default router;
