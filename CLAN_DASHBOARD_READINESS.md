# Clan Dashboard — B2B Readiness

> PMF-correction sprint · Phase 9. **Not built** (by design). This documents the architecture, data model, metrics, roadmap, and monetization so the Clan Dashboard can be built quickly once the magic moment is proven and its dependencies are live. The PMF report flagged B2B/clan as the **higher-AOV, stickier, clearer-WTP** expansion — but it is downstream of a working free loop.

## What it is

A leader pastes/links a **clan tag** → CoachScore fetches the roster and scores **every member** with the same objective engine that powers the single-account magic moment → a **leader dashboard** surfaces weak links, war-readiness, rushed accounts, and contribution balance at a glance.

One sentence: *"CoachScore for your whole clan — see every member's grade and exactly who needs what, before war."*

## Why it's the right B2B wedge

- **Higher AOV / clearer WTP.** Leaders make roster decisions (war line-up, recruitment, kicks) and will pay to triage 30–50 members at once — far more than a casual pays for one report. The catalog already carries a per-seat **Clan/Bulk ($8/seat, min 10)** SKU (gated behind `clan_plans_enabled`).
- **Stickier.** A clan re-checks every war cycle / season → recurring use, unlike one-off individual scoring.
- **Built on the same primitive.** A clan score = N individual scores. The engine, the tag adapter, and the report already exist; the clan layer is mostly orchestration + aggregation + a dashboard.

## How it leverages what already exists

- **The official API exposes clans directly:** `GET /clans/{clanTag}` returns the clan + a `memberList` of member tags/roles/donations. So a clan scan = **1 clan fetch + N member `GET /players/{tag}` fetches** — reusing the new `ProxyCocAdapter` (caching, retries, rate limiting all apply; the token-bucket limiter already paces the N member calls).
- **Per-member scoring is already done:** each member tag → `mapCocPlayerToFields` → `normalizeIntake` → `computeCoachScore`. No new scoring logic.
- **Defense/walls remain API-blind** per member (same as single-account); the clan dashboard is therefore strongest on the dimensions the API reads (heroes, offense, equipment, progression, clan) — which is exactly what war-readiness triage needs.

## Data model (proposed)

```
Clan            { clanTag, name, level, lastScanAt }
ClanScan        { id, clanTag, scannedAt, memberCount, engineVersion, dataVersion }
ClanMemberScore { scanId, playerTag, name, role, townHall, grade, overall,
                  heroes, offense, equipment, progression, clanValue,  // sub-scores
                  rushLabel, fieldsNeedingConfirmation }
```
- `ClanMemberScore` is a thin projection of the existing `CoachScoreResult` + `AccountSnapshot` — no new scoring types.
- A scan is an immutable, versioned snapshot (same discipline as `AccountSnapshot`) so leaders can track roster progress over time.

## Leader dashboard metrics

- **Roster grade distribution** (how many S/A/B/C/D/F) + average overall.
- **War-readiness %** — share of members above a goal-weighted threshold for the `war` profile.
- **Rushed count** — members whose progression/rush score flags them (`rushLabel`).
- **Weakest links** — bottom-N members by overall, with each one's biggest gap.
- **Contribution balance** — donation / capital / war signals across the roster (from the API counters).
- **Recruitment fit** — a prospective member's grade vs the roster average (a natural upsell into recruiting tools).

## Build roadmap (when unblocked)

| Phase | Scope | Depends on |
|---|---|---|
| **P0** | `ClanApiAdapter` (`GET /clans/{tag}` → member tags) behind the same proxy client | CoC API live (token + proxy) |
| **P1** | Batch member scoring (rate-limit-aware fan-out over the tag adapter) + `ClanScan` assembler | P0 |
| **P2** | Leader dashboard UI (distribution, war-readiness, weak links) | P1 + persistence |
| **P3** | War line-up assistant + recruitment fit + roster progress-over-time | P2 |

## Dependencies / why not now

The Clan Dashboard is **gated on the same long-poles as the rest of the paid product**, plus persistence:
1. **CoC API live** (token + RoyaleAPI proxy) — see `SUPERCELL_API_ACTIVATION_REPORT.md`. A clan scan is API-heavy (N members), so this must be solid first.
2. **Database + Auth** — rosters and scans must persist, and a leader must own their clan's data (cross-tenant RLS). Currently identity is anonymous and the DB is unprovisioned.
3. **Payments** — per-seat checkout (the `clan` SKU) needs the payment provider live.
4. **A proven free loop** — per the PMF report, B2B is downstream of demonstrating that the single-account magic moment retains and spreads. Build that signal first.

## Monetization potential

- **Per-seat** (in catalog): $8/seat × 10–50 members = **$80–$400 per clan scan** — an order of magnitude above a single report.
- **Clan subscription** (future): a monthly per-clan price for unlimited re-scans + war-cycle tracking → recurring revenue, the missing piece in an otherwise transactional model.
- **Recruitment funnel**: scored prospects → a natural bridge to a recruiting marketplace (an adjacent, larger opportunity noted in the market research).

**Status:** `ARCHITECTURE READY · NOT BUILT · GATED ON API + DB/AUTH + PAYMENTS + A PROVEN FREE LOOP`. The flag (`clan_plans_enabled`) and the per-seat SKU already exist; turning this on is a build, not a redesign.
