# SUPABASE MIGRATION TROUBLESHOOTING GUIDE — CoachScore (Phase N)

**Symptom:** Drizzle migrations (`drizzle-kit push` / `migrate`) and any live DB query fail to connect to Supabase from this environment — `ENOTFOUND` / connection timeout — even though `DATABASE_URL` is set and the Supabase REST/Auth API is reachable over HTTPS.

---

## 1. Root-cause analysis

CoachScore connects to Postgres via **`DATABASE_URL`** using **postgres-js** (Drizzle). The value points at the **direct** database host:

```
db.<ref>.supabase.co : 6543
```

Two problems, confirmed by live probing this environment:

1. **The direct host is IPv6-only (and here, doesn't resolve at all).** `db.<ref>.supabase.co` publishes an **AAAA (IPv6)** record and (in this sandbox) **no A (IPv4)** record. Many environments — this sandbox, lots of CI runners, some home/ISP networks — have **no IPv6 egress**, so the host either returns `ENOTFOUND` or the TCP connection to `:6543`/`:5432` times out. Meanwhile `https://<ref>.supabase.co` (REST/Auth) resolves fine because it is fronted by **Cloudflare over IPv4** — which is why "the API works but migrations don't."
2. **Port mismatch.** `6543` is the **pooler** port, but `db.<ref>` is the **direct** host. The direct host expects `5432`. Mixing the direct host with `6543` is its own misconfiguration.

> Proof from this env: `getent ahostsv4 db.<ref>.supabase.co` → empty; `getent ahostsv6` → empty/AAAA only; TCP to `:6543` → closed/timeout. `curl https://<ref>.supabase.co/rest/v1/` → `401` (reachable).

**This is not a Drizzle bug.** Drizzle's offline `generate` (which never connects) works fine — the 11 migrations exist. Only the *connecting* commands fail, because the connection string can't be reached.

---

## 2. The fix — use the Supabase connection **pooler** (IPv4)

Supabase provides a **Supavisor pooler** with an **IPv4-reachable** hostname. Use it instead of the direct host.

**Find it:** Supabase Dashboard → **Project → Connect** (or Settings → Database → *Connection string* → **"Use connection pooling"**). It looks like:

```
aws-0-<region>.pooler.supabase.com
```

### Two pooler modes — pick by use case

| Mode | Port | Connection string user | Use for | postgres-js setting |
|---|---|---|---|---|
| **Transaction** | `6543` | `postgres.<ref>` | Serverless / edge / Vercel functions (short-lived) | **`prepare: false`** (required — no prepared statements in transaction mode) |
| **Session** | `5432` | `postgres.<ref>` | **Migrations** (`drizzle-kit migrate`/`push`), long-lived servers | default |

**Recommended `DATABASE_URL` values:**

```env
# App runtime on Vercel (serverless) — TRANSACTION pooler:
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"

# Running migrations — SESSION pooler (port 5432) is the most reliable:
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

(URL-encode special characters in the password. The pooler username is `postgres.<project-ref>`, **not** plain `postgres`.)

### Drizzle / postgres-js note (transaction pooler)
If the **runtime** uses the transaction pooler (`6543`), the postgres-js client must disable prepared statements:

```ts
import postgres from 'postgres';
const client = postgres(process.env.DATABASE_URL!, { prepare: false });
```

For **migrations**, prefer the session pooler (`5432`) so no special flags are needed. `drizzle.config.ts` already reads `process.env.DATABASE_URL` — just point it at the session-pooler string when migrating.

---

## 3. Exact commands

```bash
# 0) Offline — always works, no network (regenerate SQL from schema):
pnpm drizzle-kit generate

# 1) Test raw connectivity to the pooler BEFORE migrating:
#    (expect a psql prompt / "1"; if it hangs, the string/host is wrong)
psql "postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" -c 'select 1;'

# 2) Apply migrations (session pooler):
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  pnpm drizzle-kit migrate        # or: pnpm drizzle-kit push  (for a non-versioned sync)

# 3) Verify:
psql "<session-pooler-url>" -c '\dt'           # tables exist
DATABASE_URL="<session-pooler-url>" pnpm vitest run tests/integration/rls.test.ts  # gated live RLS test
```

---

## 4. Debugging workflow (top-down)

```bash
# A) Does the DIRECT host resolve on IPv4?  (usually NO → that's the problem)
dig +short db.<ref>.supabase.co A
dig +short db.<ref>.supabase.co AAAA      # likely only this is populated

# B) Do you even have IPv6 egress?
curl -6 -s -o /dev/null -w '%{http_code}\n' https://ipv6.google.com   # 000 = no IPv6

# C) Does the POOLER resolve on IPv4?  (should be YES)
dig +short aws-0-<region>.pooler.supabase.com A

# D) Can you reach the pooler port?
nc -vz aws-0-<region>.pooler.supabase.com 5432   # "succeeded" = good

# E) Is the API (Cloudflare/IPv4) reachable while DB isn't? (confirms the IPv6 diagnosis)
curl -s -o /dev/null -w '%{http_code}\n' https://<ref>.supabase.co/rest/v1/   # 401 = reachable
```

Decision tree:
- **A empty / AAAA only + B is 000** → classic "no IPv6 to the direct host". **Use the pooler (Section 2).**
- **C resolves + D succeeds** → switch `DATABASE_URL` to the pooler and migrate. ✅
- **C/D also fail** → network egress is blocked entirely; run migrations from a different network (a machine with IPv6, or a CI runner that can reach the pooler), or from the **Supabase SQL Editor** (paste the migration SQL from `lib/db/migrations/*.sql`).

---

## 5. Alternative connection strategies (if the pooler still won't work)

1. **Run migrations from a network with IPv6 egress** (the direct `db.<ref>:5432` host works fine there).
2. **Supabase SQL Editor** (dashboard) — paste each `lib/db/migrations/<n>_*.sql` in order; bypasses local connectivity entirely. Then record them as applied.
3. **IPv4 add-on** — Supabase offers a dedicated IPv4 address for the direct host as a paid add-on, if you must use the direct connection.
4. **CI-based migration** — add a GitHub Action that connects via the pooler with `DATABASE_URL` as a secret and runs `drizzle-kit migrate` on deploy (GitHub runners reach the pooler over IPv4).

---

## 6. CoachScore-specific summary

- **Authoritative schema:** Drizzle (`lib/db/schema.ts` + `lib/db/migrations/` — 11 migrations). `supabase/` is **not** CLI-linked.
- **Do this for production:** set Vercel's `DATABASE_URL` to the **transaction** pooler (`6543`, `prepare:false` already handled by the client) for the serverless runtime; run the one-time `drizzle-kit migrate` against the **session** pooler (`5432`) from a network/CI that reaches it.
- **Why it looked broken before:** the env's `DATABASE_URL` used the IPv6-only `db.<ref>` direct host, which is unreachable from IPv4-only environments — switching to the pooler resolves it. `pnpm validate:reference` and the offline `generate` never needed the DB, which is why most of the build/test suite is green regardless.
