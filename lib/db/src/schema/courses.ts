import { pgTable, text, serial, boolean, integer, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  category: text("category").notNull().default("General"),
  isFree: boolean("is_free").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(false),
  totalDurationMinutes: integer("total_duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  // Filtered index — the public course listing always filters by isPublished=true.
  index("courses_is_published_idx").on(table.isPublished),
  index("courses_category_idx").on(table.category),
]);

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
