import { Router, type IRouter } from "express";
import { db, resourcesTable, downloadsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import {
  ListResourcesQueryParams,
  GetResourceParams,
  CreateResourceBody,
  UpdateResourceParams,
  UpdateResourceBody,
  DeleteResourceParams,
  TrackDownloadParams,
} from "@workspace/api-zod";
import { requireAuth, requireAdmin, requireActiveSubscription } from "./auth";

const router: IRouter = Router();

// GET /resources — requires subscription
router.get("/resources", requireActiveSubscription, async (req: any, res): Promise<void> => {
  const parsed = ListResourcesQueryParams.safeParse(req.query);
  let resources = await db.select().from(resourcesTable).orderBy(desc(resourcesTable.createdAt));

  if (parsed.success) {
    if (parsed.data.category) {
      resources = resources.filter(r => r.category === parsed.data.category);
    }
    if (parsed.data.search) {
      resources = resources.filter(r => r.title.toLowerCase().includes(parsed.data.search!.toLowerCase()));
    }
  }

  // Strip storageKey from response
  res.json(resources.map(({ storageKey: _, ...r }) => r));
});

// POST /resources (admin)
router.post("/resources", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [resource] = await db.insert(resourcesTable).values(parsed.data).returning();
  const { storageKey: _, ...safe } = resource;
  res.status(201).json(safe);
});

// GET /resources/:id — returns signed URL (requires subscription)
router.get("/resources/:id", requireActiveSubscription, async (req: any, res): Promise<void> => {
  const params = GetResourceParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, params.data.id));
  if (!resource) { res.status(404).json({ error: "Resource not found" }); return; }

  // Generate a signed URL (placeholder — replace with real object storage signing)
  const signedUrl = `${process.env.STORAGE_BASE_URL || "/api/files"}/${resource.storageKey}?token=signed`;
  const { storageKey: _, ...safe } = resource;
  res.json({ ...safe, signedUrl });
});

// PATCH /resources/:id (admin)
router.patch("/resources/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateResourceParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [resource] = await db.update(resourcesTable).set(parsed.data).where(eq(resourcesTable.id, params.data.id)).returning();
  if (!resource) { res.status(404).json({ error: "Resource not found" }); return; }
  const { storageKey: _, ...safe } = resource;
  res.json(safe);
});

// DELETE /resources/:id (admin)
router.delete("/resources/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteResourceParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(resourcesTable).where(eq(resourcesTable.id, params.data.id));
  res.sendStatus(204);
});

// POST /resources/:id/download — track a download
router.post("/resources/:id/download", requireActiveSubscription, async (req: any, res): Promise<void> => {
  const params = TrackDownloadParams.safeParse({ id: req.params.id });
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }

  const [resource] = await db.select().from(resourcesTable).where(eq(resourcesTable.id, params.data.id));
  if (!resource) { res.status(404).json({ error: "Resource not found" }); return; }

  await db.update(resourcesTable).set({ downloadCount: sql`${resourcesTable.downloadCount} + 1` }).where(eq(resourcesTable.id, params.data.id));

  const [download] = await db.insert(downloadsTable).values({
    userId: req.userId,
    resourceId: params.data.id,
  }).returning();

  res.json({ id: download.id, resourceId: download.resourceId, userId: download.userId, resourceTitle: resource.title, downloadedAt: download.downloadedAt });
});

export default router;
