# GAME-DATA VERIFICATION REPORT — CoachScore (Phase A)

**Date:** 2026-06-25 · **Device:** Xiaomi 22095RA98C (Android 13) · **Game:** `com.supercell.clashofclans` (installed, launched via ADB)
**Contract:** ADR-0004 anti-hallucination — *never fabricate values; anything not confirmed by an authoritative source stays `needsVerification`.*

---

## Method

1. Launched Clash of Clans on the connected device via `adb shell monkey -p com.supercell.clashofclans`.
2. Confirmed it reached the foreground (`dumpsys activity` → `com.supercell.clashofclans`).
3. Captured `adb screencap` → `screenshots/final-coc-pass/coc-device-evidence.png` (a high-Town-Hall home village, Turkish locale, well-developed base).

## Honest finding: the device cannot authoritatively verify the reference table

The reference table's `needsVerification` debt (~65 fields) is **per-Town-Hall max levels** for heroes, equipment, and the offense/defense/walls categories across **TH11–18**. A device session cannot confirm these, for three concrete reasons:

1. **One account = one Town Hall.** The connected account is a single (high) TH. You cannot read TH13's or TH15's caps from a TH16/17 base — the caps for *other* Town Halls simply aren't visible.
2. **Per-entity caps require navigation, not a base screenshot.** A max level (e.g. "TH15 Barbarian King = 90") is only confirmable by opening that hero on a maxed account at that exact TH and reading the level — across ~65 fields, on accounts spanning six Town Halls. That is not reliably drivable via `adb` screencaps, and OCR of in-game stat overlays is error-prone.
3. **Fabrication is forbidden.** Inferring "looks maxed" from a base screenshot is exactly the guess ADR-0004 prohibits. A plausible number is not a verified number.

**Therefore: zero verification flags were flipped in this pass.** Doing so from a single base screenshot would be fabrication.

## Current verification status (unchanged, stated honestly)

| Scope | Status |
|---|---|
| **TH13 hero caps** (BK 75 / AQ 75 / GW 55 / RC 25) | ✅ VERIFIED — `COACHSCORE_DEEP_DIVE_REPORT.md` §7.2 worked example |
| **TH14 hero caps** (BK 80 / AQ 80 / GW 60 / RC 30) | ✅ VERIFIED — deep-dive §7.7 |
| Equipment N/A below TH16; hero unlock TH (GW@11, RC@13, MP@16, DD@17) | ✅ structurally verified |
| Hero caps for TH11, 12, 15, 16, 17, 18 | ⚠️ best-effort, **flagged** |
| Equipment caps (TH16–18: keyEpicsTotal, maxLevel) | ⚠️ best-effort, **flagged** |
| Offense/Defense/Walls representative max levels (TH11–18) | ⚠️ best-effort, **flagged** (per-element tables are a separate data task) |

`pnpm validate:reference` continues to report this debt; it is non-fatal (structure is valid) but **blocks paid reports** (`assertPaidReportAllowed`).

## The real verification path (a data task, not a screenshot pass)

To burn down the debt **correctly**:
1. Enumerate the ~65 flagged fields (the validator already lists them).
2. For each, confirm against an **authoritative source**: the live game *at the relevant TH on a maxed account*, official Supercell patch notes, or the official API/Fankit — not a guess.
3. Update the value in `lib/game-data/reference-table.ts`, flip `needsVerification: false`, and cite the source in `sourceNotes`.
4. Re-run `pnpm validate:reference` (debt count drops) and the scoring tests.
5. When a TH's fields are all verified, `assertPaidReportAllowed` stops blocking paid reports for that TH.

This is best done by an operator with maxed accounts spanning TH11–18, or against official published tables — a structured, citable data-entry task. It is the **#1 launch long-pole** and is explicitly **not** closeable by a device screenshot or by code generation.

## Verdict

Device inspection **confirms the game runs** and the connected base is a real high-TH account, but it does **not** provide authoritative per-TH caps for the full reference table. **All existing flags are retained; nothing was fabricated.** Evidence: `screenshots/final-coc-pass/coc-device-evidence.png`.
