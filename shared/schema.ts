import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kycStatusEnum = pgEnum("kyc_status", ["pending", "verified", "restricted"]);
export const tipStatusEnum = pgEnum("tip_status", ["succeeded", "refunded", "disputed", "failed", "pending"]);
export const actorTypeEnum = pgEnum("actor_type", ["system", "admin", "worker"]);
export const payoutMethodStatusEnum = pgEnum("payout_method_status", ["none", "added", "verified"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workers = pgTable("workers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  photoUrl: text("photo_url"),
  country: text("country").notNull().default("US"),
  currency: text("currency").notNull().default("USD"),
  connectAccountId: text("connect_account_id"),
  kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
  chargesEnabled: boolean("charges_enabled").notNull().default(false),
  payoutsEnabled: boolean("payouts_enabled").notNull().default(false),
  tipsEnabled: boolean("tips_enabled").notNull().default(false),
  payoutMethodStatus: payoutMethodStatusEnum("payout_method_status").notNull().default("none"),
  suspended: boolean("suspended").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tips = pgTable("tips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workerId: varchar("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  amountGrossCents: integer("amount_gross_cents").notNull(),
  currency: text("currency").notNull().default("USD"),
  platformFeeCents: integer("platform_fee_cents").notNull(),
  processorFeeCents: integer("processor_fee_cents").notNull().default(0),
  amountNetCents: integer("amount_net_cents").notNull(),
  status: tipStatusEnum("status").notNull().default("pending"),
  payerEmail: text("payer_email"),
  note: text("note"),
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const webhookEvents = pgTable("webhook_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  payloadJson: jsonb("payload_json").notNull(),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  actorType: actorTypeEnum("actor_type").notNull(),
  actorId: varchar("actor_id"),
  action: text("action").notNull(),
  subjectTable: text("subject_table"),
  subjectId: varchar("subject_id"),
  metaJson: jsonb("meta_json"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  valueJson: jsonb("value_json").notNull(),
});

export const otpCodes = pgTable("otp_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWorkerSchema = createInsertSchema(workers).omit({
  id: true,
  userId: true,
  createdAt: true,
  connectAccountId: true,
  kycStatus: true,
  tipsEnabled: true,
  suspended: true,
}).extend({
  handle: z.string().min(3).max(30).regex(/^[a-z0-9_-]+$/, "Handle must be lowercase alphanumeric, dash, or underscore"),
  displayName: z.string().min(2).max(100),
});

export const insertTipSchema = createInsertSchema(tips).omit({
  id: true,
  createdAt: true,
  workerId: true,
  platformFeeCents: true,
  processorFeeCents: true,
  amountNetCents: true,
  status: true,
  paymentIntentId: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAppSettingSchema = createInsertSchema(appSettings);

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Worker = typeof workers.$inferSelect;
export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type Tip = typeof tips.$inferSelect;
export type InsertTip = z.infer<typeof insertTipSchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
