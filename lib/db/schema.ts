/**
 * Drizzle schema — CoachScore persistence (Phase 3).
 *
 * Postgres (Supabase) is not provisioned yet; this schema is the source of
 * truth from which `drizzle-kit generate` emits SQL migrations offline. Tables
 * are intentionally declarative (no callback defaults) so the file is pure data
 * definition. JSONB columns are typed to the domain shapes the engine/AI/intake
 * layers produce, so reads/writes are end-to-end typed once activated.
 *
 * Row-Level Security (deny-by-default) is defined separately in
 * `lib/db/migrations/0001_rls_policies.sql` (ADR-style: see docs/db/RLS.md).
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import type { Goal, NormalizedAccount } from '@/lib/core';
import type { ProviderUsage, ReportDraft } from '@/lib/ai';
import type { SnapshotProvenance } from '@/lib/snapshot';

// --- Enums ------------------------------------------------------------------

export const userRole = pgEnum('user_role', ['user', 'coach', 'admin']);
export const intakeSource = pgEnum('intake_source', [
  'tag',
  'screenshot',
  'manual',
]);
export const reportTier = pgEnum('report_tier', [
  'free',
  'basic',
  'standard',
  'pro',
  'account_rescue',
  'clan',
]);
export const reportStatus = pgEnum('report_status', [
  'pending',
  'drafting',
  'awaiting_review',
  'approved',
  'delivered',
  'failed',
]);
export const uploadKind = pgEnum('upload_kind', [
  'screenshot',
  'pdf',
  'share_card',
]);
export const uploadStatus = pgEnum('upload_status', [
  'pending',
  'stored',
  'failed',
]);
export const jobKind = pgEnum('job_kind', ['extraction', 'report_draft']);
export const jobStatus = pgEnum('job_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'dead_letter',
]);
export const orderStatus = pgEnum('order_status', [
  'pending',
  'paid',
  'fulfilled',
  'refunded',
  'failed',
  'expired',
]);
export const entitlementSource = pgEnum('entitlement_source', [
  'purchase',
  'grant',
  'promo',
]);
export const emailStatus = pgEnum('email_status', ['queued', 'sent', 'failed']);
export const emailTemplate = pgEnum('email_template', [
  'report_ready',
  'receipt',
]);

// --- Tables -----------------------------------------------------------------

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  displayName: text('display_name'),
  role: userRole('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    playerTag: text('player_tag'),
    townHall: integer('town_hall').notNull(),
    source: intakeSource('source').notNull(),
    label: text('label'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('accounts_user_id_idx').on(t.userId)],
);

export const accountSnapshots = pgTable(
  'account_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    snapshotHash: text('snapshot_hash').notNull(),
    goal: text('goal').$type<Goal>().notNull(),
    townHall: integer('town_hall').notNull(),
    normalizedAccount: jsonb('normalized_account')
      .$type<NormalizedAccount>()
      .notNull(),
    provenance: jsonb('provenance').$type<SnapshotProvenance>().notNull(),
    engineVersion: text('engine_version').notNull(),
    referenceTableVersion: text('reference_table_version').notNull(),
    knowledgeBaseVersion: text('knowledge_base_version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('account_snapshots_account_id_idx').on(t.accountId),
    uniqueIndex('account_snapshots_account_hash_uq').on(
      t.accountId,
      t.snapshotHash,
    ),
  ],
);

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: uuid('account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => accountSnapshots.id, { onDelete: 'restrict' }),
    goal: text('goal').$type<Goal>().notNull(),
    tier: reportTier('tier').notNull(),
    status: reportStatus('status').notNull().default('pending'),
    overall: integer('overall'),
    grade: text('grade'),
    paid: boolean('paid').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('reports_account_id_idx').on(t.accountId)],
);

export const reportDrafts = pgTable(
  'report_drafts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    snapshotId: uuid('snapshot_id')
      .notNull()
      .references(() => accountSnapshots.id, { onDelete: 'restrict' }),
    draft: jsonb('draft').$type<ReportDraft | null>(),
    confidence: real('confidence').notNull(),
    needsHumanReview: boolean('needs_human_review').notNull(),
    flags: jsonb('flags').$type<string[]>().notNull(),
    attempts: integer('attempts').notNull(),
    referenceReady: boolean('reference_ready').notNull(),
    usage: jsonb('usage').$type<ProviderUsage | null>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('report_drafts_report_id_idx').on(t.reportId)],
);

export const uploads = pgTable(
  'uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    accountId: uuid('account_id').references(() => accounts.id, {
      onDelete: 'set null',
    }),
    kind: uploadKind('kind').notNull(),
    storageKey: text('storage_key').notNull(),
    contentType: text('content_type').notNull(),
    byteSize: integer('byte_size').notNull(),
    status: uploadStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('uploads_storage_key_uq').on(t.storageKey)],
);

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    idempotencyKey: text('idempotency_key').notNull(),
    kind: jobKind('kind').notNull(),
    status: jobStatus('status').notNull().default('pending'),
    attempts: integer('attempts').notNull().default(0),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('jobs_idempotency_key_uq').on(t.idempotencyKey)],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('audit_logs_entity_idx').on(t.entityType, t.entityId)],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reportId: uuid('report_id').references(() => reports.id, {
      onDelete: 'set null',
    }),
    tier: reportTier('tier').notNull(),
    quantity: integer('quantity').notNull().default(1),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: orderStatus('status').notNull().default('pending'),
    stripeSessionId: text('stripe_session_id'),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('orders_user_id_idx').on(t.userId),
    uniqueIndex('orders_stripe_session_uq').on(t.stripeSessionId),
  ],
);

export const entitlements = pgTable(
  'entitlements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    sku: reportTier('sku').notNull(),
    reportId: uuid('report_id').references(() => reports.id, {
      onDelete: 'set null',
    }),
    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    source: entitlementSource('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('entitlements_user_id_idx').on(t.userId)],
);

export const emailDeliveries = pgTable(
  'email_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    toEmail: text('to_email').notNull(),
    template: emailTemplate('template').notNull(),
    status: emailStatus('status').notNull().default('queued'),
    relatedReportId: uuid('related_report_id').references(() => reports.id, {
      onDelete: 'set null',
    }),
    providerId: text('provider_id'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('email_deliveries_to_idx').on(t.toEmail)],
);

// --- Inferred row types ------------------------------------------------------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type AccountSnapshotRow = typeof accountSnapshots.$inferSelect;
export type NewAccountSnapshotRow = typeof accountSnapshots.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportDraftRow = typeof reportDrafts.$inferSelect;
export type NewReportDraftRow = typeof reportDrafts.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;
export type EmailDelivery = typeof emailDeliveries.$inferSelect;
export type NewEmailDelivery = typeof emailDeliveries.$inferInsert;
