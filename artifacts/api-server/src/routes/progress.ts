import { Router, type IRouter } from "express";
import { db, progressTable, lessonsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  MarkLessonCompleteParams,
  MarkLessonCompleteBody,
} from "@workspace/api-zod";
import { requireAuth } from "./auth";

const router: IRouter = Router();

// GET /progress
router.get("/progress", requireAuth, async (req: any, res): Promise<void> => {
  const records = await db.select().from(progressTable).where(eq(progressTable.userId, req.userId));
  res.json(records);
});

// POST /progress/:lessonId
router.post("/progress/:lessonId", requireAuth, async (req: any, res): Promise<void> => {
  const params = MarkLessonCompleteParams.safeParse({ lessonId: req.params.lessonId });
  if (!params.success) { res.status(400).json({ error: "Invalid lessonId" }); return; }
  const parsed = MarkLessonCompleteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, params.data.lessonId));
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

  const [existing] = await db.select().from(progressTable).where(
    and(eq(progressTable.userId, req.userId), eq(progressTable.lessonId, params.data.lessonId))
  );

  let record;
  if (existing) {
    [record] = await db.update(progressTable)
      .set({ completed: parsed.data.completed, lastAccessedAt: new Date() })
      .where(eq(progressTable.id, existing.id))
      .returning();
  } else {
    [record] = await db.insert(progressTable).values({
      userId: req.userId,
      lessonId: params.data.lessonId,
      courseId: lesson.courseId,
      completed: parsed.data.completed,
    }).returning();
  }

  res.json(record);
});

export default router;
