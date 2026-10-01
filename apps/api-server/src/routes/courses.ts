import { Router, type IRouter } from "express";
import { db, coursesTable, lessonsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListCoursesQueryParams,
  GetCourseParams,
  UpdateCourseParams,
  UpdateCourseBody,
  DeleteCourseParams,
  CreateCourseBody,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin } from "./auth";

const router: IRouter = Router();

// GET /courses
router.get("/courses", async (req, res): Promise<void> => {
  const parsed = ListCoursesQueryParams.safeParse(req.query);

  const courses = await db
    .select({
      id: coursesTable.id,
      title: coursesTable.title,
      slug: coursesTable.slug,
      description: coursesTable.description,
      thumbnailUrl: coursesTable.thumbnailUrl,
      category: coursesTable.category,
      isFree: coursesTable.isFree,
      isPublished: coursesTable.isPublished,
      totalDurationMinutes: coursesTable.totalDurationMinutes,
      createdAt: coursesTable.createdAt,
      updatedAt: coursesTable.updatedAt,
      lessonCount: sql<number>`cast(count(${lessonsTable.id}) as int)`,
    })
    .from(coursesTable)
    .leftJoin(lessonsTable, and(eq(lessonsTable.courseId, coursesTable.id), eq(lessonsTable.isPublished, true)))
    .where(
      parsed.success && parsed.data.category
        ? and(eq(coursesTable.isPublished, true), eq(coursesTable.category, parsed.data.category))
        : eq(coursesTable.isPublished, true)
    )
    .groupBy(coursesTable.id);

  const filtered = parsed.success && parsed.data.search
    ? courses.filter(c => c.title.toLowerCase().includes(parsed.data.search!.toLowerCase()))
    : courses;

  res.json(filtered);
});

// POST /courses
router.post("/courses", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const slug = parsed.data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 80);
  const [course] = await db.insert(coursesTable).values({ ...parsed.data, slug }).returning();
  res.status(201).json({ ...course, lessonCount: 0 });
});

// GET /courses/:id
router.get("/courses/:id", async (req, res): Promise<void> => {
  const params = GetCourseParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [course] = await db.select().from(coursesTable).where(and(eq(coursesTable.id, params.data.id), eq(coursesTable.isPublished, true)));
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(and(eq(lessonsTable.courseId, params.data.id), eq(lessonsTable.isPublished, true)))
    .orderBy(lessonsTable.order);

  res.json({ ...course, lessons, lessonCount: lessons.length });
});

// PATCH /courses/:id
router.patch("/courses/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCourseParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [course] = await db.update(coursesTable).set(parsed.data).where(eq(coursesTable.id, params.data.id)).returning();
  if (!course) { res.status(404).json({ error: "Course not found" }); return; }

  const lessonCount = await db.$count(lessonsTable, eq(lessonsTable.courseId, course.id));
  res.json({ ...course, lessonCount });
});

// DELETE /courses/:id
router.delete("/courses/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCourseParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  await db.delete(coursesTable).where(eq(coursesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
