import { Router, type IRouter } from "express";
import { db, lessonsTable, subscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListLessonsParams,
  CreateLessonParams,
  CreateLessonBody,
  GetLessonParams,
  UpdateLessonParams,
  UpdateLessonBody,
  DeleteLessonParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "./auth";
import { getAuth } from "@clerk/express";

const router: IRouter = Router();

// GET /courses/:courseId/lessons
router.get("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.courseId, params.data.courseId), eq(lessonsTable.isPublished, true)))
    .orderBy(lessonsTable.order);

  res.json(lessons);
});

// POST /courses/:courseId/lessons
router.post("/courses/:courseId/lessons", requireAdmin, async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) { res.status(400).json({ error: "Invalid courseId" }); return; }
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [lesson] = await db.insert(lessonsTable).values({ ...parsed.data, courseId: params.data.courseId }).returning();
  res.status(201).json(lesson);
});

// GET /courses/:courseId/lessons/:id
router.get("/courses/:courseId/lessons/:id", async (req, res): Promise<void> => {
  const params = GetLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId), eq(lessonsTable.isPublished, true)));
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }

  // If not free, check subscription
  if (!lesson.isFree) {
    const auth = getAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) { res.status(403).json({ error: "Subscription required" }); return; }
    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId as string));
    if (!sub || sub.status !== "active") { res.status(403).json({ error: "Active subscription required" }); return; }
  }

  res.json(lesson);
});

// PATCH /courses/:courseId/lessons/:id
router.patch("/courses/:courseId/lessons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }
  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [lesson] = await db.update(lessonsTable).set(parsed.data).where(eq(lessonsTable.id, params.data.id)).returning();
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  res.json(lesson);
});

// DELETE /courses/:courseId/lessons/:id
router.delete("/courses/:courseId/lessons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }
  await db.delete(lessonsTable).where(eq(lessonsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
