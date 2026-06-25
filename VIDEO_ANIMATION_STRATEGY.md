# VIDEO / ANIMATION STRATEGY — CoachScore (Phase K)

**Question:** can short (4–5s) authentic Clash of Clans clips be used to make the product more immersive — and if so, how, performantly and legally?

**Short answer:** **Do not embed raw Supercell gameplay clips in the paid product without a licensing/legal decision.** Get the premium-motion lift now from **original, no-IP-risk motion** (Lottie / CSS / sprite animation of *our own* assets). Treat real gameplay video as a *post-licensing* enhancement, self-hosted and lazy, never autoplaying on the critical path.

---

## 1. Legality (the gating factor)

- Clash of Clans footage, art, characters, and the name are **Supercell's copyrighted/trademarked IP**.
- Supercell's **Fan Content Policy** grants a limited license to use their assets in *fan content* (videos, sites) **if** it's clearly **unofficial**, non-deceptive, and follows the policy — which is how YouTubers monetize CoC content. CoachScore already carries the required "unofficial, not endorsed by Supercell" disclaimer.
- **The risk for CoachScore specifically:** it is a **paid SaaS**, and this sprint's goal ("feel like an official premium Clash of Clans platform") pushes toward *implying official affiliation* — exactly the trademark line the disclaimer exists to avoid. Bundling Supercell gameplay clips into a commercial product, on a live commercial domain, is a materially higher-risk use than a creator's YouTube video.
- **Recommendation:** before any real Supercell footage ships, get an explicit call from the operator (ideally with a quick legal review) that the usage is within the Fan Content Policy and clearly unofficial. Until then, **use original motion only** (below). This matches the project's own compliance rules ("only public data; no Supercell trademark; unofficial").

## 2. Performance (why video is risky on the critical path)

The audience is **~70% Android** (deep-dive), often on mobile data. Hero-section autoplay video is one of the worst things for the metrics CoachScore is optimized for:
- **LCP**: a video/poster can become the LCP element and is far heavier than the current static/SSG HTML (~106 KB first-load today).
- **CLS**: a video without reserved dimensions shifts layout.
- **INP/jank**: decoding video competes with main-thread work.
- **Data/battery**: autoplaying loops burn mobile data and battery; users on `Save-Data` resent it.

**Rule:** nothing video may block first paint or autoplay above the fold on mobile. The current static-first posture (the SEO/CWV win) must not be traded away for motion.

## 3. If real video is used (post-licensing): hosting + optimization

- **Format:** ship **WebM (VP9/AV1)** + an **MP4 (H.264)** fallback via `<source>`. ≤5s, ~720p, **target < 500 KB–1 MB** per clip.
- **Element:** `<video muted loop playsinline preload="none" poster="…">` — `muted`+`playsinline` are required for mobile autoplay; `preload="none"` + a **poster image** avoids the download until needed and prevents CLS (set explicit `width`/`height` / aspect-ratio).
- **Lazy + respectful:** start playback only via `IntersectionObserver` when in view; **honor `prefers-reduced-motion`** and the **`Save-Data`** header (show the poster, don't load the video).
- **Hosting:** self-host the optimized files on the CDN (Vercel static / Cloudflare R2 — already provisioned) with long-cache immutable headers; or a video CDN (**Mux / Cloudflare Stream**) for adaptive streaming if clip count grows.

## 4. Alternatives, ranked (what to actually do now)

| Approach | IP risk | Perf | Effort | Use for |
|---|---|---|---|---|
| **1. Lottie (JSON) / CSS / SVG motion of OUR OWN assets** | **None** | **Excellent** (KB-scale, GPU/vector, scriptable) | Low–Med | ✅ **Recommended** — hero crest shimmer, score-ring count-up, loading art, reveal animations |
| **2. Sprite-sheet animation (our own art)** | None | Great (one image + steps) | Med | Looping decorative motion, particle bursts |
| **3. Self-hosted muted WebM loop** | **High** if Supercell footage; none if our own/licensed | OK if lazy | Med | Only with licensed/own footage, below the fold |
| **4. Raw Supercell gameplay clips** | **High** (commercial use) | Heavy | — | ❌ Avoid pending licensing/legal review |

**CoachScore already has the foundation for (1):** the `float`, `pulse-glow`, `shimmer`, and `count-up` keyframes in `tailwind.config.ts`, the animated `ScoreRing`, and the generated decorative assets. Lottie can be added with the lightweight `lottie-react` / `dotlottie` player for richer hero/loading motion **without any IP exposure**.

## 5. Recommendation

1. **Now (no IP risk):** invest in **Lottie + CSS/SVG motion of our own brand assets** for the hero, score reveal, and loading states. This delivers the "premium, alive" feel with the best CWV profile and zero legal exposure.
2. **Later (gated):** if the operator confirms (with legal sign-off) that short authentic clips are within Supercell's Fan Content Policy for this paid product, add them **self-hosted, lazy, muted, poster-backed, reduced-motion-aware, below the fold** per Section 3.
3. **Never:** autoplay heavy video above the fold on mobile, or ship Supercell footage that implies official affiliation.
