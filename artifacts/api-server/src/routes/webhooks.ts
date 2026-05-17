/**
 * Clerk Webhook Handler
 *
 * Receives events from Clerk and syncs user data to the database instantly.
 * This is the primary sync mechanism — every signup, profile update, and
 * account deletion from Clerk writes to Neon automatically.
 *
 * Supported events:
 *   user.created  → INSERT into users (or upsert if row already exists)
 *   user.updated  → UPDATE email, name, avatarUrl
 *   user.deleted  → Anonymise the row (keep for referential integrity)
 *
 * Setup:
 *   1. Deploy the API server
 *   2. In Clerk dashboard → Webhooks → Add Endpoint
 *      URL: https://your-api.onrender.com/api/webhooks/clerk
 *      Events: user.created, user.updated, user.deleted
 *   3. Copy the Signing Secret → set CLERK_WEBHOOK_SECRET env var on Render
 */

import { Router, type IRouter } from "express";
import { Webhook } from "svix";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function extractUserFields(data: any): {
  email: string;
  name: string;
  avatarUrl: string | null;
} {
  const primaryEmail =
    data.email_addresses?.find(
      (e: any) => e.id === data.primary_email_address_id,
    )?.email_address ?? "";

  const name =
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.username ||
    "";

  const avatarUrl = data.image_url || data.profile_image_url || null;

  return { email: primaryEmail, name, avatarUrl };
}

// POST /webhooks/clerk
// NOTE: express.raw() is applied to this path in app.ts — req.body is a Buffer
router.post("/webhooks/clerk", async (req: any, res): Promise<void> => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    req.log.error("CLERK_WEBHOOK_SECRET is not set — cannot verify webhook");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId = req.headers["svix-id"] as string | undefined;
  const svixTimestamp = req.headers["svix-timestamp"] as string | undefined;
  const svixSignature = req.headers["svix-signature"] as string | undefined;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing Svix headers" });
    return;
  }

  let evt: { type: string; data: any };
  try {
    const wh = new Webhook(secret);
    const payload =
      req.body instanceof Buffer ? req.body.toString("utf8") : req.body;
    evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as { type: string; data: any };
  } catch (err) {
    req.log.warn({ err }, "Clerk webhook signature verification failed");
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  const { type, data } = evt;
  req.log.info({ eventType: type, clerkId: data.id }, "Clerk webhook received");

  try {
    if (type === "user.created" || type === "user.updated") {
      const { email, name, avatarUrl } = extractUserFields(data);

      await db
        .insert(usersTable)
        .values({ clerkId: data.id, email, name, avatarUrl })
        .onConflictDoUpdate({
          target: usersTable.clerkId,
          set: { email, name, avatarUrl },
        });

      req.log.info({ clerkId: data.id, type }, "User upserted from Clerk webhook");
    }

    if (type === "user.deleted") {
      if (data.id) {
        // Anonymise PII but keep the row so foreign keys (subscriptions,
        // progress, downloads) remain intact.
        await db
          .update(usersTable)
          .set({
            email: `deleted_${data.id}@deleted.invalid`,
            name: "Deleted User",
            avatarUrl: null,
            bio: null,
          })
          .where(eq(usersTable.clerkId, data.id));

        req.log.info({ clerkId: data.id }, "User anonymised from Clerk webhook");
      }
    }
  } catch (err) {
    req.log.error({ err, eventType: type }, "Failed to process Clerk webhook");
    res.status(500).json({ error: "Database error" });
    return;
  }

  res.json({ received: true });
});

export default router;
