import { pgTable, text, serial, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("audit_logs_admin_id_idx").on(table.adminId),
  index("audit_logs_created_at_idx").on(table.createdAt),
]);

export type AuditLog = typeof auditLogsTable.$inferSelect;
