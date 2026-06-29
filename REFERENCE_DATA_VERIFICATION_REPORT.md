# Reference-Data Verification Report

> PMF-correction sprint · Phase 4. Scope per the brief: **TH16, TH17, TH18 only** — do not attempt to verify every Town Hall. Sources: the official Clash of Clans Fandom wiki (Hero Hall, Walls, Blacksmith pages) and direct supercell.com release notes, cross-checked June 2026. **Nothing is marked verified that could not be confirmed.**

## Headline

A prior session was suspected of fabricating future content. **That suspicion was wrong** — independent direct fetches of supercell.com confirm **Town Hall 18 (live Nov 2025) and Dragon Duke (the 6th hero, shipped Feb/Mar 2026) are real.** The genuine defects were **stale numbers**, now corrected. The TH16–18 hero caps and wall levels are now **verified**; a few residual fields remain honestly flagged.

## What was corrected (was wrong/stale → now verified)

| TH | Field | Was | Now | Source |
|----|-------|-----|-----|--------|
| 16 | Minion Prince cap | 40 | **80** | Fandom Hero Hall 10 |
| 17 | Minion Prince cap | 60 | **90** | Fandom Hero Hall 11 |
| 18 | Barbarian King cap | 105 | **110** | Fandom (TH18 = max TH) |
| 18 | Archer Queen cap | 105 | **110** | Fandom |
| 18 | Grand Warden cap | 80 | **85** | Fandom |
| 18 | Minion Prince cap | 70 | **95** | Fandom |
| 17 | Wall max level | 17 | **18** | Fandom Walls |
| 18 | Wall max level | 18 | **19** | Fandom Walls |
| 16 | Dragon Duke | locked | **unlocked** (unlocks at TH15) | Fandom / Pocket Tactics |
| 16/17 | Equipment max level | 15 / 18 | **27** (epic cap, Blacksmith maxes at TH16) | Fandom Blacksmith |

## What is now VERIFIED (`needsVerification: false`) at TH16–18

- **Hero caps** for the five established heroes: Barbarian King, Archer Queen, Grand Warden, Royal Champion, **Minion Prince**.
  - TH16: BK 95 · AQ 95 · GW 70 · RC 45 · MP 80
  - TH17: BK 100 · AQ 100 · GW 75 · RC 50 · MP 90
  - TH18: BK 110 · AQ 110 · GW 85 · RC 55 · MP 95
- **Wall max levels**: TH16 = 17 · TH17 = 18 · TH18 = 19.

## What remains BEST-EFFORT (`needsVerification: true`) — honestly flagged

| Field | Why still flagged |
|---|---|
| **Dragon Duke** per-TH caps | Newest hero (Feb/Mar 2026); per-TH caps not reliably documented yet. Modeled as unlocked at TH15+ with a best-effort cap. Smallest hero contribution; the player's DD level still comes from the live API. |
| **Equipment epic count** (`keyEpicsTotal`) | The epic-equipment roster is global (not TH-gated) and grows with patches (~17 as of mid-2026). The 6/8 figures are kept pending a confirmed roster. The equipment **max level (27)** is corrected and verified. |
| **Offense / Defense `representativeMaxLevel`** | These are single placeholder integers standing in for a full per-element troop/spell/defense table — a separate data task. **Not used by the scoring engine** (see below). |
| **TH11–15** | Out of scope this sprint. Note: Minion Prince (unlocks TH9) and Dragon Duke (unlocks TH15) are still modeled as locked at some of these lower THs — a known residual to fix when those THs are verified. |

## Paid-readiness gate (the "remove the blocker for verified TH" step)

The blocker (`assertPaidReportAllowed` / `referenceDataReadiness`, `lib/ai/readiness.ts`) previously tripped on **any** verification debt for a TH — including placeholder fields that don't affect the score. It now gates on the data that **actually determines the (tag-path) score**:

- **Hero caps** for the five established heroes (the dominant dimension), **plus** the wall max level.
- It deliberately does **not** gate on: the offense/defense "representative" category placeholders (the tag path derives offense from the **live API** and excludes defenses/walls it can't read), Dragon Duke's cap (smallest weight; its level is real-from-API, the cap only clamps), or the equipment epic count.

**Result:** **TH16, TH17, and TH18 are now paid-ready** (`ready === true`, `assertPaidReportAllowed` does not throw). TH11–15 remain blocked (their hero caps/walls are unverified). This is asserted by `tests/ai/readiness.test.ts`.

## Why the API's `maxLevel` does NOT make this table redundant

The official API returns each unit's **absolute** max level (across all THs), not the per-TH cap (it exposes a separate computed `hallMaxLevel` only via libraries, not the raw API). So per-TH hero completion **must** come from this reference table — which is exactly why getting TH16–18 hero caps right matters, and why the table's existence is justified.

## Honest limits

- Verification is against the **community Fandom wiki + official release notes**, cross-checked June 2026 — authoritative for caps but not a Supercell-signed data feed. Bump `version` + `effectiveFrom` on each game patch (now `0.2.0-th18`, `2026-06-29`).
- Dragon Duke, the equipment epic roster, and the per-element offense/defense tables are **genuinely not verified** and are not claimed to be. They do not gate paid reports because they do not determine the tag-path score, but they are visible debt in `validateReferenceTable()` and `pnpm validate:reference`.
- No numbers were invented to clear a flag.
