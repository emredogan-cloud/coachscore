# Backup & Disaster Recovery (Phase 9)

## What must survive
| Asset | Store | Backup mechanism |
|---|---|---|
| Relational data (accounts, snapshots, orders, reports, growth tables) | Supabase Postgres | Automated daily backups + **Point-In-Time Recovery** (enable PITR on the project) |
| Uploaded media / generated PDFs / share cards | Cloudflare R2 | Object **versioning** + lifecycle rules; regenerable artifacts can be re-rendered deterministically |
| Secrets / config | Vercel env + a secrets manager | Documented inventory (`docs/ENV_SETUP_GUIDE.md`); rotate-able |
| Source + migrations | GitHub | Git history is the source of truth |

## Targets
- **RPO ≤ 24h** (daily backup) tightening to **≤ 5 min** with PITR for the relational store.
- **RTO ≤ 4h** for a full region failure (restore Supabase from backup/PITR + redeploy on Vercel).

The data moat — `account_snapshots` — is **never deleted**, only tiered to R2 (see `docs/db/PARTITIONING_RETENTION.md`); losing it loses the durable advantage, so it is the top backup priority.

## Restore procedure (DB)
1. Provision a new Supabase project (or restore in place).
2. Restore from the latest backup, or PITR to a timestamp just before the incident.
3. Apply any migrations newer than the backup (`migrations/` in order).
4. Run the RLS cross-tenant suite (`SUPABASE_RLS_TEST=1 pnpm test:integration`) before reconnecting traffic.
5. Repoint `DATABASE_URL` (+ Supabase keys) in Vercel; redeploy; verify `/api/health`.

## Restore procedure (storage)
- R2 object versioning allows per-object restore. Regenerable artifacts (PDFs, share cards) need no restore — re-render from the snapshot.

## DR drills
- Run a restore-to-staging drill quarterly; record actual RTO/RPO and fix gaps.
- Verify backups are actually restorable (an untested backup is not a backup).

## Data-subject erasure (GDPR/KVKK)
- Erasure cascades via FKs (user delete → owned rows). Backups age out per the retention policy; document the erasure-vs-backup window in the DPA.
