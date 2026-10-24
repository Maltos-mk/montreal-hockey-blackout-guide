# HockeyBlackouts.ca - Agent Operating Standards & Guidelines

This document codifies development, analytics, and architectural standards for AI agents and developers working on this codebase.

---

## 1. UTM Tracking Taxonomy & Standards

To prevent dashboard fragmentation in Umami and Google Analytics, all promotional links, redirects, and app shortcuts MUST follow this strict taxonomy.

### Hierarchy & Definitions

| Parameter | Purpose | Valid Values | Anti-Patterns (Do NOT Use) |
| :--- | :--- | :--- | :--- |
| `utm_source` | **Platform / Ecosystem** | `reddit`, `pwa`, `twitter`, `threads`, `bluesky`, `direct_bookmark`, hostname (for external referrers) | Do NOT put subreddit or account names here (e.g. `r_leafs`). |
| `utm_medium` | **High-level Channel / Distribution Format** | `social` (all social posts/comments), `homescreen` (PWA app launches), `legacy_redirect` (old domain hops) | Do NOT put subreddits here (e.g. `r_leafs`, `r_habs`, `community`). Medium must roll up into high-level channel buckets. |
| `utm_campaign` | **Product / Asset / Core Initiative** | `blackout_guide` (team schedules & hubs), `blackout_inspector` (`/how-blackouts-work/`), `sn_exclusive` (Sportsnet+ rules) | Do NOT create ad-hoc one-off campaign names for every comment. |
| `utm_content` | **Specific Placement / Subreddit / Context** | Subreddit (`r_leafs`, `r_habs`, `r_canadahockey`, `r_canadacordcutters`), or placement type (`post_link`, `comment_reply`, `sidebar`) | Do NOT leave empty if posting into a specific community. |

### Standard Canonical Promo Links

#### Team Hubs on Reddit
* **Toronto (`r/leafs`):**  
  `https://hockeyblackouts.ca/toronto/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_leafs`
* **Montreal (`r/habs`):**  
  `https://hockeyblackouts.ca/montreal/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_habs`
* **Ottawa (`r/sens`):**  
  `https://hockeyblackouts.ca/ottawa/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_sens`
* **Winnipeg (`r/winnipegjets`):**  
  `https://hockeyblackouts.ca/winnipeg/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_winnipegjets`
* **Edmonton (`r/edmontonoilers`):**  
  `https://hockeyblackouts.ca/edmonton/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_edmontonoilers`
* **Calgary (`r/calgaryflames`):**  
  `https://hockeyblackouts.ca/calgary/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_calgaryflames`
* **Vancouver (`r/canucks`):**  
  `https://hockeyblackouts.ca/vancouver/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_guide&utm_content=r_canucks`

#### Tool & Explainer Links on Reddit
* **Blackout IP Inspector (`/how-blackouts-work/`):**  
  `https://hockeyblackouts.ca/how-blackouts-work/?utm_source=reddit&utm_medium=social&utm_campaign=blackout_inspector&utm_content=[r_community]`
  *(e.g. `&utm_content=r_canadahockey` or `&utm_content=r_canadacordcutters`)*

#### PWA & System Telemetry (Built into Code)
* **PWA Standalone App Launch:**  
  `./?utm_source=pwa&utm_medium=homescreen`
* **Legacy Satellite Repo Redirect:**  
  `?utm_source=[upstream_host]&utm_medium=legacy_redirect`

---

## 2. SEO & Technical Architecture Guardrails

1. **Clean Canonicals:** Every page MUST declare `<link rel="canonical" href="https://hockeyblackouts.ca/{path}/">`. Client-side scripts MUST NEVER mutate `window.location.hash` or query parameters on untouched default page loads.
2. **HTML Byte Ceiling (< 120 KB):** Prerendered HTML payloads must stay strictly under 120 KB to prevent Bingbot truncation before `<section id="faq">`.
3. **Declarative vs. Imperative Analytics:** Never combine `data-umami-event` HTML attributes with manual `.track()` click listeners on the same element, and never fire conversion/click events on initial page load.

---

## 3. Deployment & Security Invariants

1. **Push Permission:** Never execute `git push` without presenting the proposed commits and receiving an explicit "Proceed" from the user.
2. **Identity & Privacy:** Commits must use author `Maltos <1071443+Maltos-mk@users.noreply.github.com>`. The user is anonymous. Never include PII.
3. **Automated Verification:** Before committing or deploying, run `npm run test:all`.
