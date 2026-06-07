import { Router, type IRouter } from "express";
import { db, pool, usersTable, coursesTable, lessonsTable } from "@workspace/db";
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
    const result = await pool.query(
      "SELECT * FROM announcements WHERE is_active = true ORDER BY created_at DESC LIMIT 3"
    );
    res.json({ announcements: result.rows });
  } catch {
    res.json({ announcements: [] });
  }
});

export default router;
