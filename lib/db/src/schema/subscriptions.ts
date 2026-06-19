import { pgTable, text, serial, boolean, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  esewaTransactionId: text("esewa_transaction_id"),
  status: text("status").notNull().default("inactive"), // active | inactive | canceled | past_due
  plan: text("plan").notNull().default("none"), // none | monthly | yearly
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("subscriptions_status_idx").on(table.status),
  index("subscriptions_period_end_idx").on(table.currentPeriodEnd),
  // Unique constraint enforces DB-level replay protection: the same eSewa
  // transaction ID can never be inserted twice, even under concurrent requests.
  uniqueIndex("subscriptions_esewa_txn_unique").on(table.esewaTransactionId),
]);

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
