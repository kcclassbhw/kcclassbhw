import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, lessonsTable, announcementsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/public/stats", async (_req, res): Promise<void> => {
  try {
    const [totalUsersResult] = await db.select({ value: count() }).from(usersTable);
    const [totalCoursesResult] = await db.select({ value: count() }).from(coursesTable).where(eq(coursesTable.isPublished, true));
    const [totalLessonsResult] = await db.select({ value: count() }).from(lessonsTable).where(eq(lessonsTable.isPublished, true));
    res.json({
      totalUsers: Number(totalUsersResult?.value ?? 0),
      totalCourses: Number(totalCoursesResult?.value ?? 0),
      totalLessons: Number(totalLessonsResult?.value ?? 0),
    });
  } catch {
    res.json({ totalUsers: 0, totalCourses: 0, totalLessons: 0 });
  }
});

router.get("/public/announcements", async (_req, res): Promise<void> => {
  try {
    const announcements = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.isActive, true))
      .orderBy(announcementsTable.createdAt)
      .limit(3);
    res.json({ announcements });
  } catch {
    res.json({ announcements: [] });
  }
});

export default router;
