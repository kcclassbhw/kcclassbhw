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
import { requireAuth, requireAdmin, safeGetAuth } from "./auth";

const router: IRouter = Router();

// Regex for validating a YouTube video ID (exactly 11 alphanumeric/-/_ chars)
const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/;
// Only allow https:// URLs for video/thumbnail fields
const HTTPS_URL_RE = /^https:\/\/.+/;

export function sanitizeLessonInput(data: Record<string, unknown>) {
  if (data.youtubeVideoId !== undefined && data.youtubeVideoId !== null) {
    if (typeof data.youtubeVideoId !== "string" || !YOUTUBE_ID_RE.test(data.youtubeVideoId as string)) {
      return { error: "youtubeVideoId must be exactly 11 alphanumeric characters" };
    }
  }
  if (data.videoUrl !== undefined && data.videoUrl !== null) {
    if (typeof data.videoUrl !== "string" || !HTTPS_URL_RE.test(data.videoUrl as string)) {
      return { error: "videoUrl must be a valid https:// URL" };
    }
  }
  if (data.thumbnailUrl !== undefined && data.thumbnailUrl !== null) {
    if (typeof data.thumbnailUrl !== "string" || !HTTPS_URL_RE.test(data.thumbnailUrl as string)) {
      return { error: "thumbnailUrl must be a valid https:// URL" };
    }
  }
  return null;
}

// GET /courses/:courseId/lessons
// SECURITY: strips videoUrl + youtubeVideoId from premium lessons for non-subscribers.
// The individual lesson GET endpoint enforces subscription too, but this list endpoint
// was returning full records to unauthenticated users — a complete revenue bypass.
router.get("/courses/:courseId/lessons", async (req, res): Promise<void> => {
  const params = ListLessonsParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) { res.status(400).json({ error: "Invalid courseId" }); return; }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.courseId, params.data.courseId), eq(lessonsTable.isPublished, true)))
    .orderBy(lessonsTable.order);

  // Determine if the requester has an active subscription
  const authState = safeGetAuth(req);
  const userId = authState?.sessionClaims?.userId || authState?.userId;
  let hasActiveSub = false;
  if (userId) {
    const [sub] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.userId, userId as string));
    const isExpired = sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();
    hasActiveSub = !!(sub && sub.status === "active" && !isExpired);
  }

  // Strip sensitive video fields from premium lessons for non-subscribers.
  // Free lessons always return their fields. Subscribers get everything.
  const sanitized = lessons.map(lesson => {
    if (lesson.isFree || hasActiveSub) return lesson;
    return { ...lesson, videoUrl: null, youtubeVideoId: null };
  });

  res.json(sanitized);
});

// POST /courses/:courseId/lessons
router.post("/courses/:courseId/lessons", requireAdmin, async (req, res): Promise<void> => {
  const params = CreateLessonParams.safeParse({ courseId: req.params.courseId });
  if (!params.success) { res.status(400).json({ error: "Invalid courseId" }); return; }
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const validationError = sanitizeLessonInput(parsed.data as Record<string, unknown>);
  if (validationError) { res.status(400).json(validationError); return; }

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

  // If not free, check subscription AND expiry
  if (!lesson.isFree) {
    const auth = safeGetAuth(req);
    const userId = auth?.sessionClaims?.userId || auth?.userId;
    if (!userId) { res.status(403).json({ error: "Subscription required" }); return; }

    const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.userId, userId as string));
    const isExpired = sub?.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date();

    if (!sub || sub.status !== "active" || isExpired) {
      res.status(403).json({ error: "Active subscription required" });
      return;
    }
  }

  res.json(lesson);
});

// PATCH /courses/:courseId/lessons/:id
router.patch("/courses/:courseId/lessons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }
  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const validationError = sanitizeLessonInput(parsed.data as Record<string, unknown>);
  if (validationError) { res.status(400).json(validationError); return; }

  const [lesson] = await db
    .update(lessonsTable)
    .set(parsed.data)
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId)))
    .returning();
  if (!lesson) { res.status(404).json({ error: "Lesson not found" }); return; }
  res.json(lesson);
});

// DELETE /courses/:courseId/lessons/:id
router.delete("/courses/:courseId/lessons/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteLessonParams.safeParse({ courseId: req.params.courseId, id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid params" }); return; }
  await db
    .delete(lessonsTable)
    .where(and(eq(lessonsTable.id, params.data.id), eq(lessonsTable.courseId, params.data.courseId)));
  res.sendStatus(204);
});

export default router;
