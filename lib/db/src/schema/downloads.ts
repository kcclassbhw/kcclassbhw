import { pgTable, text, serial, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const downloadsTable = pgTable("downloads", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  resourceId: integer("resource_id").notNull(),
  downloadedAt: timestamp("downloaded_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("downloads_user_id_idx").on(table.userId),
]);

export const insertDownloadSchema = createInsertSchema(downloadsTable).omit({ id: true });
export type InsertDownload = z.infer<typeof insertDownloadSchema>;
export type Download = typeof downloadsTable.$inferSelect;
