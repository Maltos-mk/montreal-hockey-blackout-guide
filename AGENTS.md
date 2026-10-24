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

### Universal Link Formula
`https://hockeyblackouts.ca/{page}/?utm_source={platform}&utm_medium={format}&utm_campaign={asset}&utm_content={placement}`

* **`utm_source`:** `reddit` | `twitter` | `facebook` | `threads` | `bluesky` | `pwa` (never subreddits or handles).
* **`utm_medium`:** `social` (all social posts/comments), `homescreen` (PWA app launches), `legacy_redirect` (domain hops).
* **`utm_campaign`:** `blackout_guide` (team hubs/schedules), `blackout_inspector` (`/how-blackouts-work/`), `sn_exclusive` (Sportsnet+ rules).
* **`utm_content`:** Subreddit (`r_leafs`, `r_habs`, `r_canadahockey`, `r_canadacordcutters`), or placement (`post_link`, `comment_reply`).

### Automated CLI Generator
Generate canonical UTM URLs instantly via `scripts/utm.js`:
```bash
node scripts/utm.js <team|page> [source] [content] [campaign]
# Example: node scripts/utm.js toronto reddit r_leafs
# Example: node scripts/utm.js inspector reddit r_canadahockey
```

*For the complete historical replacement registry of past one-off links and satellite hops, see [`docs/utm_registry.md`](./docs/utm_registry.md).*

---

## 2. Umami Event Taxonomy & Rules

All custom events in Umami MUST follow strict lowercase `kebab-case` naming to ensure clean dashboard sorting.

### Event Registry by Category

| Category | Event Name | Trigger Type | Payload Properties | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Monetization & Outbound** | `kofi-click` | Declarative | `variant` (`anti_gambling`, `control`, etc.) | Ko-fi tip button clicks |
| | `amazon-prime-click` | Declarative | None | Outbound Amazon Prime affiliate link clicks |
| | `stream-referral-click` | Declarative | `provider` (`sportsnet`, `tsn`) | Outbound streaming provider referral links |
| | `radio-click` | Declarative | None | Audio radio broadcast fallback clicks |
| **App Utility & Sharing** | `export-pdf-click` | Declarative | None | Schedule PDF print/download |
| | `share-native` | Programmatic | `team` | Native OS mobile share sheet successfully opened |
| | `share-copy-link` | Programmatic | `team` | Link copied to clipboard (desktop fallback) |
| **PWA Install Funnel** | `pwa-prompt-viewed` | Programmatic | `os` (`ios`, `android_desktop`), `team` | Install modal rendered |
| | `pwa-install-accepted` | Programmatic | `team` | User clicked "Install Now" in modal |
| | `pwa-prompt-dismissed` | Programmatic | `permanent` (`true`, `false`), `team` | User dismissed install modal |
| | `pwa-install-success` | Programmatic | `team` | Native browser `appinstalled` event fired |
| **Diagnostic & Navigation** | `ip-inspector-check` | Declarative | None | User clicked "Scan My Connection" |
| | `ip-inspector-verdict` | Programmatic | `status` (`match`, `mismatch`), `team`, `detected_region` | IP lookup result evaluated |
| | `sideways-team-cta-click` | Declarative | `team` | Primary team card button clicked on explainer page |

### Event Rules & Invariants
1. **Strict Kebab-Case:** Never use `snake_case` or `Title Case` for event names or attribute keys.
2. **Zero Double-Firing:** Never attach `data-umami-event` to an element that also triggers an `umami.track()` call in an `onclick` listener.
3. **No Synthetic Page-Load Events:** Never fire impression or conversion events automatically on untouched page loads.

---

## 3. SEO & Technical Architecture Guardrails

1. **Clean Canonicals:** Every page MUST declare `<link rel="canonical" href="https://hockeyblackouts.ca/{path}/">`. Client-side scripts MUST NEVER mutate `window.location.hash` or query parameters on untouched default page loads.
2. **HTML Byte Ceiling (< 120 KB):** Prerendered HTML payloads must stay strictly under 120 KB to prevent Bingbot truncation before `<section id="faq">`.
3. **Declarative vs. Imperative Analytics:** Never combine `data-umami-event` HTML attributes with manual `.track()` click listeners on the same element, and never fire conversion/click events on initial page load.

---

## 4. Deployment & Security Invariants

1. **Push Permission:** Never execute `git push` without presenting the proposed commits and receiving an explicit "Proceed" from the user.
2. **Identity & Privacy:** Commits must use author `Maltos <1071443+Maltos-mk@users.noreply.github.com>`. The user is anonymous. Never include PII.
3. **Automated Verification:** Before committing or deploying, run `npm run test:all`.
