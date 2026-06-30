# Screen Recording Analysis (Phase 8)

**Question:** Why is screen recording "blocked" on CoachScore, and is it intentional, accidental, browser/DRM/CSS/PWA/Android-policy related?

**Short answer:** **CoachScore does not block screen recording.** There is nothing in the codebase — no DRM, no secure-window flag, no CSS, no PWA/manifest setting, no security header — that can or does prevent the OS or user from recording or screenshotting the app. CoachScore is a **web PWA**, and a web page is architecturally *incapable* of setting the one Android flag that blocks capture (`FLAG_SECURE`). So any blocked-capture experience is **external** (the browser's own mode, the device/OS, or a vendor policy), not something the app does or can fix in code.

---

## How screen-capture blocking actually works (the mechanism)

On Android, screenshots and screen recording of an app are suppressed by exactly one mechanism: the app's native window sets **`WindowManager.LayoutParams.FLAG_SECURE`**. When set, the OS renders a black frame to the recorder/screenshotter.

Critically:

- **Only a native Android app (or the system/browser) can set `FLAG_SECURE`.** A website/PWA running inside Chrome **cannot** set it — it has no access to the Android window. CoachScore is a PWA (see ADR `docs/adr/0006-web-first-pwa-stripe-no-app-store.md`), so it is on the wrong side of the sandbox to block capture even if it wanted to.
- The browser itself sets `FLAG_SECURE` on its own window in only two situations:
  1. **Incognito tabs** — Android Chrome blocks screenshots/recording of Incognito by default.
  2. **DRM (EME) playback** — when a page plays Widevine/EME-protected media, Chrome secures the surface during playback.

CoachScore uses **neither**.

---

## What the codebase actually contains (evidence)

A full scan of the repo for every capture/DRM/secure-surface mechanism returns **nothing**:

| Looked for | Purpose | Found in CoachScore? |
|---|---|---|
| `getDisplayMedia` | screen-capture API use | **No** |
| `FLAG_SECURE` | the Android capture-blocking flag | **No** (and a PWA can't set it) |
| `requestMediaKeySystemAccess` / `encrypted-media` (EME) | DRM that triggers a secure surface | **No** |
| `Permissions-Policy: display-capture` | could disable the capture API | **No** |
| DRM libraries / Widevine | protected playback | **No** |
| CSS / overlay anti-capture tricks | (cannot block OS capture anyway) | **No** |

### The one header that looks related but isn't

`next.config.mjs` sets:

```
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

This disables **the page's own** access to the camera, microphone, and geolocation Web APIs (a hardening measure — CoachScore never needs them). It has **nothing to do** with the user or OS recording the screen. There is no `display-capture` entry, so even the page's own screen-capture API is left at the browser default.

Other headers present (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) are standard hardening and are likewise unrelated to screen capture.

---

## Answering each candidate cause

- **Browser restriction?** Not caused by the app. If capture is blocked, the browser is doing it for its own reason (see Incognito below) — the app sends no signal that would trigger it.
- **DRM?** No. No EME/Widevine anywhere; no protected media.
- **CSS issue?** No — and not possible. CSS cannot suppress OS-level screen capture.
- **PWA setting?** No. There is no PWA/manifest capability to block recording (none exists in the web platform), and the manifest declares none.
- **Android policy?** This is the only real lever, and it is **outside the app**: `FLAG_SECURE` is set by the browser/OS, not by a web page.

---

## Most likely real-world explanations (in order)

1. **Testing in a Chrome Incognito tab.** Android Chrome blocks screenshots/recording of Incognito tabs by default — the recording comes out black. **Fix: use a normal (non-Incognito) tab**, or the installed PWA.
2. **Device/vendor policy (the test device is a Xiaomi/MIUI).** MIUI and some OEM ROMs restrict screenshots/recording in certain modes or via security settings; the system screen-recorder also needs an explicit capture permission grant. **Fix: grant the screen-record permission and check MIUI security/screenshot settings.**
3. **OS screen-recorder permission denied.** If the system recorder wasn't granted capture permission, *every* app records black, not just CoachScore.

None of these are app behavior.

---

## Intentional or accidental?

- **Intentional?** No. Nothing in CoachScore intends to or does block capture.
- **Accidental?** No app-side bug either — there is nothing in the app to misconfigure here, and (as above) a PWA cannot block capture even by accident.

**Therefore there is no code change to make.** Adding code can't "unblock" recording that the app was never blocking, and a PWA can't toggle `FLAG_SECURE`. The actionable fixes are all on the testing/device side (use a non-Incognito tab; grant recorder permission; review MIUI settings).

> If CoachScore is ever wrapped as a native app (TWA/APK) in the future, capture would still be allowed by default — we would only need to **avoid** adding `FLAG_SECURE`. That is a future-native note, not a current web fix.

## Verification performed

- Repo-wide grep for `getDisplayMedia`, `FLAG_SECURE`, `requestMediaKeySystemAccess`, `encrypted-media`, `display-capture`, `screen-capture`, DRM/Widevine → **zero matches**.
- Read `next.config.mjs` headers in full (only the unrelated `camera/microphone/geolocation` Permissions-Policy + standard hardening).
- Confirmed CoachScore ships as a PWA (ADR 0006), which cannot set Android's capture-blocking flag.
