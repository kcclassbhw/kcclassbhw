import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, lessonsTable, announcementsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";

const router: IRouter = Router();

// GET /public/sitemap.xml — dynamic sitemap including all published course pages.
// Update robots.txt Sitemap: directive to point to this endpoint's public URL.
router.get("/public/sitemap.xml", async (_req, res): Promise<void> => {
  const frontendUrl = (process.env.FRONTEND_URL || "https://kcclassbhw.vercel.app").replace(/\/$/, "");

  try {
    const courses = await db
      .select({ slug: coursesTable.slug, updatedAt: coursesTable.updatedAt })
      .from(coursesTable)
      .where(eq(coursesTable.isPublished, true));

    type SitemapEntry = { loc: string; priority: string; changefreq: string; lastmod?: string };

    const staticPages: SitemapEntry[] = [
      { loc: `${frontendUrl}/`, priority: "1.0", changefreq: "weekly" },
      { loc: `${frontendUrl}/courses`, priority: "0.9", changefreq: "weekly" },
      { loc: `${frontendUrl}/pricing`, priority: "0.8", changefreq: "monthly" },
      { loc: `${frontendUrl}/videos`, priority: "0.7", changefreq: "daily" },
    ];

    const coursePages: SitemapEntry[] = courses.map(c => ({
      loc: `${frontendUrl}/courses/${c.slug}`,
      priority: "0.8",
      changefreq: "weekly",
      lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().split("T")[0] : undefined,
    }));

    const allPages = [...staticPages, ...coursePages];

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      ...allPages.map(p => [
        `  <url>`,
        `    <loc>${p.loc}</loc>`,
        `    <changefreq>${p.changefreq}</changefreq>`,
        `    <priority>${p.priority}</priority>`,
        p.lastmod ? `    <lastmod>${p.lastmod}</lastmod>` : "",
        `  </url>`,
      ].filter(Boolean).join("\n")),
      `</urlset>`,
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);
  } catch {
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

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
