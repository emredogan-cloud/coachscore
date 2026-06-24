# Database scaling plan — partitioning, archival, retention (Phase 8)

Status: **PLAN (not yet executed)** — these are the documented strategies the high-growth tables adopt as volume warrants. The Phase-8 performance indexes (`migrations/0010`) ship now; the structural changes below are staged so they can be applied without a rewrite.

## 1. Partitioning

### `account_snapshots` — the high-growth table
Snapshots are immutable and append-only; volume grows with every intake. Plan:
- **Range-partition by `created_at`** (monthly partitions), e.g. `account_snapshots_2026_06`.
- Queries are almost always "latest snapshot for an account" or "by hash" — both keep working with partition pruning on the time column plus the existing `account_id` / hash indexes per partition.
- Migration path: create the partitioned parent, attach a default partition, backfill, swap. Do this **before** the table crosses ~10M rows; until then a single table + indexes is fine.

### `analytics_events` — append-only event stream
- **Range-partition by `occurred_at`** (monthly). Old partitions are cheap to detach + drop under the retention policy below.

## 2. Archival

- **Cold snapshots → R2.** Snapshots older than the active window (e.g. 12 months) and not referenced by a live report are serialized to the existing R2 bucket (`coachscore-media`) under `archive/snapshots/…` and their partition detached. Re-analysis of an archived account re-hydrates on demand. Zero-egress R2 keeps this cheap.
- **Generated artifacts** (PDFs, share cards) already live in R2; apply a lifecycle rule to expire regenerable artifacts after N days (they are deterministic and can be re-rendered).

## 3. Retention policies

| Data | Retention | Rationale |
|---|---|---|
| `analytics_events` | 13 months hot, then drop the partition | Funnel/MoM trend analysis needs ~12 months; PostHog is the long-term analytics store. GDPR/KVKK data-minimization. |
| `lifecycle_messages` (sent/skipped/failed) | 90 days, then purge | Operational queue; terminal rows have no long-term value. |
| `jobs` (completed/dead-letter) | 30 days, then purge completed; keep dead-letter 90 days | Idempotency window + post-mortem on failures. |
| `account_snapshots` | Retain (archive cold to R2) | The data moat — never deleted, only tiered. |
| `audit_logs` | Retain ≥ 24 months | Compliance + dispute resolution. |
| Uploaded screenshots (R2) | Expire after report delivery + grace window | PII minimization (screenshots may contain names). |

Purges run as scheduled jobs (the durable queue / a cron) using `DELETE … WHERE created_at < now() - interval` or partition `DETACH`+`DROP` (far cheaper at scale).

## 4. Operational notes
- All structural changes are **online-safe** (create-index-concurrently, attach/detach partitions) — no downtime.
- Verify partition pruning with `EXPLAIN` after each change.
- The retention purges must respect GDPR/KVKK **erasure requests** (a user-deletion cascade already exists via FKs; partitioned tables keep the same cascade semantics).
