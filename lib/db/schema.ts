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
export const coachStatus = pgEnum('coach_status', [
  'applied',
  'under_review',
  'approved',
  'active',
  'suspended',
  'deactivated',
  'rejected',
]);
export const applicationStatus = pgEnum('application_status', [
  'pending',
  'approved',
  'rejected',
]);
export const reviewStatus = pgEnum('review_status', [
  'unassigned',
  'assigned',
  'claimed',
  'in_review',
  'submitted',
  'approved',
  'rejected',
  'escalated',
]);
export const moderationStatus = pgEnum('moderation_status', [
  'pending',
  'approved',
  'revision_requested',
  'rejected',
]);
export const disputeStatus = pgEnum('dispute_status', [
  'open',
  'under_review',
  'resolved',
  'refunded',
  'rejected',
]);
export const ratingModeration = pgEnum('rating_moderation', [
  'visible',
  'flagged',
  'hidden',
]);
export const payoutAccountStatus = pgEnum('payout_account_status', [
  'pending',
  'onboarding',
  'active',
  'restricted',
]);
export const payoutStatus = pgEnum('payout_status', [
  'pending',
  'paid',
  'failed',
]);
export const notificationKind = pgEnum('notification_kind', [
  'assignment',
  'review_completion',
  'escalation',
  'payout',
  'dispute',
]);
export const notificationStatus = pgEnum('notification_status', [
  'queued',
  'sent',
  'failed',
  'read',
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

export const coaches = pgTable(
  'coaches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull(),
    status: coachStatus('status').notNull().default('applied'),
    specialties: jsonb('specialties').$type<string[]>().notNull(),
    hourlyRateCents: integer('hourly_rate_cents'),
    acceptingWork: boolean('accepting_work').notNull().default(true),
    weeklyCapacity: integer('weekly_capacity').notNull().default(10),
    ratingAverage: real('rating_average').notNull().default(0),
    ratingCount: integer('rating_count').notNull().default(0),
    reputationScore: integer('reputation_score').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('coaches_user_id_uq').on(t.userId)],
);

export const coachApplications = pgTable(
  'coach_applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: applicationStatus('status').notNull().default('pending'),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull(),
    specialties: jsonb('specialties').$type<string[]>().notNull(),
    motivation: text('motivation').notNull(),
    experience: text('experience').notNull(),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('coach_applications_user_id_idx').on(t.userId)],
);

export const reviewAssignments = pgTable(
  'review_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    reportDraftId: uuid('report_draft_id').references(() => reportDrafts.id, {
      onDelete: 'set null',
    }),
    coachId: uuid('coach_id').references(() => coaches.id, {
      onDelete: 'set null',
    }),
    status: reviewStatus('status').notNull().default('unassigned'),
    editedDraft: jsonb('edited_draft').$type<ReportDraft | null>(),
    notes: text('notes'),
    claimedAt: timestamp('claimed_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('review_assignments_coach_id_idx').on(t.coachId),
    index('review_assignments_status_idx').on(t.status),
  ],
);

export const moderations = pgTable(
  'moderations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reviewAssignmentId: uuid('review_assignment_id')
      .notNull()
      .references(() => reviewAssignments.id, { onDelete: 'cascade' }),
    status: moderationStatus('status').notNull().default('pending'),
    moderatorUserId: uuid('moderator_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('moderations_assignment_idx').on(t.reviewAssignmentId)],
);

export const coachRatings = pgTable(
  'coach_ratings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    reportId: uuid('report_id').references(() => reports.id, {
      onDelete: 'set null',
    }),
    raterUserId: uuid('rater_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    stars: integer('stars').notNull(),
    comment: text('comment'),
    moderation: ratingModeration('moderation').notNull().default('visible'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('coach_ratings_coach_id_idx').on(t.coachId)],
);

export const payoutAccounts = pgTable(
  'payout_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    provider: text('provider').notNull().default('stripe_connect'),
    externalAccountId: text('external_account_id'),
    status: payoutAccountStatus('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex('payout_accounts_coach_id_uq').on(t.coachId)],
);

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    coachId: uuid('coach_id')
      .notNull()
      .references(() => coaches.id, { onDelete: 'cascade' }),
    reviewAssignmentId: uuid('review_assignment_id').references(
      () => reviewAssignments.id,
      { onDelete: 'set null' },
    ),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    status: payoutStatus('status').notNull().default('pending'),
    externalPayoutId: text('external_payout_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('payouts_coach_id_idx').on(t.coachId)],
);

export const disputes = pgTable(
  'disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reportId: uuid('report_id').references(() => reports.id, {
      onDelete: 'set null',
    }),
    orderId: uuid('order_id').references(() => orders.id, {
      onDelete: 'set null',
    }),
    raisedByUserId: uuid('raised_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: disputeStatus('status').notNull().default('open'),
    reason: text('reason').notNull(),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('disputes_status_idx').on(t.status)],
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    kind: notificationKind('kind').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    status: notificationStatus('status').notNull().default('queued'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index('notifications_user_id_idx').on(t.userId)],
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
export type Coach = typeof coaches.$inferSelect;
export type NewCoach = typeof coaches.$inferInsert;
export type CoachApplication = typeof coachApplications.$inferSelect;
export type NewCoachApplication = typeof coachApplications.$inferInsert;
export type ReviewAssignment = typeof reviewAssignments.$inferSelect;
export type NewReviewAssignment = typeof reviewAssignments.$inferInsert;
export type Moderation = typeof moderations.$inferSelect;
export type NewModeration = typeof moderations.$inferInsert;
export type CoachRating = typeof coachRatings.$inferSelect;
export type NewCoachRating = typeof coachRatings.$inferInsert;
export type PayoutAccount = typeof payoutAccounts.$inferSelect;
export type NewPayoutAccount = typeof payoutAccounts.$inferInsert;
export type Payout = typeof payouts.$inferSelect;
export type NewPayout = typeof payouts.$inferInsert;
export type Dispute = typeof disputes.$inferSelect;
export type NewDispute = typeof disputes.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
