import { pgTable, text, serial, boolean, integer, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const progressTable = pgTable("progress", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lessonId: integer("lesson_id").notNull(),
  courseId: integer("course_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Unique constraint allows atomic upsert in the progress route — prevents
  // duplicate rows from concurrent requests.
  uniqueIndex("progress_user_lesson_unique").on(table.userId, table.lessonId),
  index("progress_user_id_idx").on(table.userId),
  index("progress_course_id_idx").on(table.courseId),
]);

export const insertProgressSchema = createInsertSchema(progressTable).omit({ id: true });
export type InsertProgress = z.infer<typeof insertProgressSchema>;
export type Progress = typeof progressTable.$inferSelect;
