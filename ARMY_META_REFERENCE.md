# Army Meta Reference

> Source-of-truth notes for the War Intelligence engine (`lib/armies/catalog.ts`, `lib/war/`, `lib/meta/`). Version **0.1.0**, effective **2026-06-30**.

## What this is (and is not)

This is a **community/creator strategic meta** — the kind of "what army should I run" coaching a YouTuber or clan mentor gives. It is **NOT** official Supercell balance data, and it is **not** fabricated game-data caps (those live in `lib/game-data` and are separately verified). The army list, the Town Hall at which each becomes viable, and the rough development it needs are **strategic recommendations**, encoded so the engine never recommends an army a player can't field.

Honesty rules (same spirit as the game-data reference):
- **Versioned + patch-aware.** Bump `META_VERSION` + `META_EFFECTIVE_FROM` on each balance patch; the meta shifts.
- **No impossible recommendations.** Every army has a `minTownHall`; the engine filters strictly by it.
- **Requirements are heuristics**, expressed as "hero completion vs your TH caps" + "army/lab development %", not exact per-troop level tables. They are deliberately coarse and labelled as guidance.

## Hero unlock Town Halls (verified)

From the Fandom Hero Hall page (cross-checked Jun 2026): Barbarian King TH7 · Archer Queen TH8 · Minion Prince TH9 · Grand Warden TH11 · Royal Champion TH13 · Dragon Duke TH15. (`lib/meta/version.ts`.)

## Army catalog (TH16–18 era)

| Army | minTH | Goals | Tier | Leans on | Source basis |
|---|---|---|---|---|---|
| Mass Dragons | 9 | war/farm/trophy | C | low hero dep | classic beginner air |
| LavaLoon | 11 | war/cwl/trophy | B | Warden | long-standing air meta |
| Electro Dragons | 13 | war/cwl/trophy | B | Warden | TH13+ air, low skill floor |
| Super Hog spam | 13 | trophy/farm/war | B | Royal Champion | repeatable hog spam |
| Yeti Smash | 13 | war/cwl | B | Warden, RC | ground smash |
| Queen Charge Hybrid | 14 | war/cwl | S | AQ, GW, RC | high-ceiling 3-star |
| Super Archer Blimp | 14 | war/cwl | A | GW, RC | blimp payload |
| Root Rider Smash | 15 | war/cwl/trophy | S | GW, RC | dominant TH15–16 spam |
| Hydra (Drag+Electro) | 15 | war/cwl | S | Warden | heavy air |
| Electro Titan Smash | 16 | war/cwl | A | GW, RC | TH16+ ground smash |

> Sources: widely-documented community/creator metas (e.g. base-review creators, Clash strategy sites) for the TH16–18 era. These are strategy recommendations; confirm against the live meta each balance patch. No army here implies official endorsement.

## How the engine uses it (`lib/war/engine.ts`)

- **Availability:** `minTownHall <= player TH` (hard gate — never impossible).
- **Goal filter:** prefer armies whose `goals` include the player's goal; fall back to all available if none match.
- **Fit (0–100):** blends hero completion (vs verified TH caps) against the army's `minHeroCompletion` and the player's army/lab development against `minLabPct`.
- **Readiness score:** `0.4·heroCompletion + 0.3·labPct + 0.3·bestArmyFit`, mapped to tiers Not Ready / Partially Ready / War Ready / Elite War Ready, and a war-tier projection (Casual / Competitive / CWL Ready).
- **Time-to-ready:** a rough estimate from the gap to "war-ready", scaled by Town Hall — explicitly a heuristic, not a precise build-time calculation.

## Tests

`tests/war/engine.test.ts` — catalog integrity, the 10×10 army×Town-Hall **never-impossible invariant**, goal filtering, hero-completion bounds, readiness tiers (maxed → Elite, fresh → Not Ready), per-TH/goal validity, determinism, and monotonicity. 100+ cases.
