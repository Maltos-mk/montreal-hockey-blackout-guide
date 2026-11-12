# Pre-Launch SEO & Analytics Audit Report: `hockeyblackouts.ca` & `hockeyblackouts.com`

**Audit Date:** 2026-11-11  
**Mode:** Read-only evidence-based audit (verified against live hosts via HTTP `fetch` / `curl` / mobile Playwright `Pixel 5`, plus local `build/`, `build_com/`, `templates/`, and `scripts/`).

---

## 1. Pre-Launch Verdicts

| Domain | Search Engine | Verdict | Summary of Blocking Issues |
| :--- | :--- | :--- | :--- |
| `https://hockeyblackouts.ca` | **Google** | **READY AFTER DEPLOY** | **P0-5**, **P0-6**, and **P0-7** are now fixed in the repo and verified by `npm run test:all`; ready to submit once deployed. |
| `https://hockeyblackouts.ca` | **Bing** | **READY AFTER DEPLOY** | **P0-5**, **P0-6**, and **P0-7** are now fixed in the repo (all team hubs total HTML `<= 119,073 B` and `#faq` `< 120,000 B`). Ready to submit once deployed. |
| `https://hockeyblackouts.com` | **Google** | **READY AFTER DEPLOY** | **P0-1** is **FIXED LIVE**; **P0-2** (`404.html`), **P0-3** (`_headers` `noindex` on `*.pages.dev`), **P0-4** (`< 125 KB`), **P1-1 through P1-3**, and **P2-1 / P2-3** are fixed in the repo and verified by `npm run test:all`. |
| `https://hockeyblackouts.com` | **Bing** | **READY AFTER DEPLOY** | **P0-1** is **FIXED LIVE**; **P0-2**, **P0-3**, **P0-4** (`97,505–99,510 B`), **P1-1 through P1-3**, and **P2-1 / P2-3** are fixed in the repo and verified locally. Ready to submit once deployed. |

---

## 2. Prioritized Findings & Bugs

### P0 — Blockers (Fix Before Search Console / Bing Submission)

| ID | Status | Site | Affected URL(s) | Observed Evidence | Why It Matters | Concrete Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **FIXED LIVE** | `.com` | `http://www.hockeyblackouts.com/`, `http://www.hockeyblackouts.com/toronto/` | Previously returned `HTTP/1.1 522`. After enabling Cloudflare **Always Use HTTPS**, live `curl -I -L` now returns `301 -> https://www.hockeyblackouts.com/... -> 301 -> https://hockeyblackouts.com/... -> HTTP/2 200`. | Crawlers and plain-HTTP links to `www` no longer hit origin timeout errors. | Done in Cloudflare Dashboard (`SSL/TLS` -> `Edge Certificates` -> `Always Use HTTPS: On`). *(Optional: update the `www` Redirect Rule to match `Hostname equals www.hockeyblackouts.com` for a 1-hop `301`.)* |
| **P0-2** | **FIXED IN REPO (pending deploy)** | `.com` | `https://hockeyblackouts.com/<nonexistent>/`, `https://hockeyblackouts.com/manifest.json` | Live `HEAD` on `/nonexistent-audit-test-404/` and `/manifest.json` returns `HTTP/2 200` with `content-type: text/html; charset=utf-8` (66,554 B homepage HTML). Added `templates/us_404.html` + `renderUs404Page` in `scripts/generate_us_team_pages.js` -> generates `build_com/404.html` (`noindex, nofollow`, zero canonical/hreflang). | Cloudflare Pages' default SPA fallback turns typos, bots, and missing assets into **soft 404** duplicates of `/`. | Done in `templates/us_404.html`, `scripts/generate_us_team_pages.js`, and `scripts/qa_validator.js` — will resolve live once deployed to Cloudflare Pages. |
| **P0-3** | **FIXED IN REPO (pending deploy)** | `.com` | `https://hockeyblackouts-us.pages.dev/`, `https://hockeyblackouts-us.pages.dev/toronto/` | Previously returned `HTTP/2 200` with `x-robots-tag: null`. Now `scripts/generate_us_team_pages.js` writes `build_com/_headers` setting `X-Robots-Tag: noindex, nofollow` on `https://:project.pages.dev/*` and `https://:version.:project.pages.dev/*` (verified by `scripts/qa_validator.js`). | A brand-new `.com` domain competing against a live `200 OK` `.pages.dev` mirror risks preview host indexation in Bing/Google. | Done in `scripts/generate_us_team_pages.js` and `scripts/qa_validator.js` — will resolve live once deployed to Cloudflare Pages (`curl -I https://hockeyblackouts-us.pages.dev/` should return `x-robots-tag: noindex, nofollow`). |
| **P0-4** | **FIXED IN REPO (pending deploy)** | `.com` | All 32 `.com` team hubs (`/anaheim-ducks/` … `/winnipeg/`) | Previously **132,625–134,638 B**. Extracted the inline `<script>` block (`templates/us_team.html` `L414-L875`) into deferred `/shared/us-territories.js` and `/shared/us-app.js` (`fetchpriority="high"`), emitted by `scripts/generate_us_team_pages.js`. All 32 `build_com/<slug>/index.html` files now measure **96,834–98,847 B** (`<= 125 KB` enforced in `scripts/qa_validator.js`). | Violates the **125 KB** HTML ceiling across all 32 `.com` team hubs and wastes transfer size on every uncached HTML hit. | Done in `templates/us_team.html`, `shared/us-app.js`, `scripts/generate_us_team_pages.js`, and `scripts/qa_validator.js` — will resolve live once deployed to Cloudflare Pages. |
| **P0-5** | **FIXED IN REPO (pending deploy)** | `.ca` | 15 US-team pages on `.ca` (and all `/game/` link generators) | Added `scripts/lib/date_utils.js` (`formatEtDate` in `America/Toronto`) and wired it into `scripts/build.js`, `scripts/build_game_pages.js`, `scripts/build_all.js`, `scripts/build_fr.js`, `scripts/build_explainers.js`, `scripts/generate_og_cards.js`, `scripts/post_bluesky.js`, `scripts/bluesky_concierge_radar.js`, and `shared/app.js` (`ET_DATE_FMT`). `scripts/qa_validator.js` now verifies `0` broken `/game/` links across all 587 `.ca` HTML files. | Broken internal links on 15 core `.ca` hubs burn crawl budget and fail users clicking upcoming matchups. | Done across all schedule/game-link builders + client `shared/app.js` + `scripts/qa_validator.js` — will resolve live once deployed to GitHub Pages. |
| **P0-6** | **FIXED IN REPO (pending deploy)** | `.ca` | All 32 `.ca` English team hubs (+ explainers, game pages, OG cards, Bluesky bot) | Removed duplicate orphan JSON-LD Q1 (`Monday Night Hockey`) from `templates/index.html`, replaced remaining Prime `Monday` copy with **Wednesday Night Hockey** (`scripts/build_explainers.js`, `scripts/build_game_pages.js`, `scripts/generate_og_cards.js`, `scripts/bluesky_concierge_radar.js`), and unified `FAQ_ONTARIO_BOUNDARY`, `SCHEMA_ONTARIO_QUESTION`, and `SCHEMA_ONTARIO_BOUNDARY` in `scripts/build.js`. `scripts/qa_validator.js` now enforces 1:1 `FAQPage` JSON-LD vs. `#faq` parity on all 32 teams. | Google structured data policies require `FAQPage` JSON-LD text to match the visible FAQ verbatim; mismatched/hidden schema and Monday vs. Wednesday contradictions risk rich-result disqualification. | Done in `templates/index.html`, `scripts/build.js`, `scripts/build_explainers.js`, `scripts/build_game_pages.js`, `scripts/generate_og_cards.js`, `scripts/bluesky_concierge_radar.js`, and `scripts/qa_validator.js` — will resolve live once deployed. |
| **P0-7** | **FIXED IN REPO (pending deploy)** | `.ca` | `https://hockeyblackouts.ca/sitemap.xml` | Switched `scripts/build_all.js` to iterate `all32CaTeams` and prioritized upcoming/recent `/game/` URLs into remaining slots under `CA_SITEMAP_MAX_URLS = 80`. Verified `build/sitemap.xml` has **80 URLs** (`39` evergreen including all 32 team hubs + `41` `/game/` pages) with `scripts/qa_validator.js` asserting all 32 teams present. | 25 evergreen `.ca` team hubs (which hold reciprocated `hreflang` targets from `.com`) are missing from `.ca/sitemap.xml`. | Done in `scripts/build_all.js` and `scripts/qa_validator.js` — will resolve live once deployed to GitHub Pages. |

---

### P1 — Fix Soon

| ID | Status | Site | Affected URL(s) | Observed Evidence | Why It Matters | Concrete Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1-1** | **FIXED IN REPO (pending deploy)** | `.com` | All 33 `.com` pages + `.com/404.html` + `.ca/` | Fixed across `scripts/generate_us_team_pages.js`, `templates/us_team.html`, `templates/us_splash.html`, `templates/us_header.html`, `templates/us_footer.html`, `templates/splash.html`, `shared/us-app.js`, `shared/us-pwa.js`, and enforced in `scripts/qa_validator.js`: added `data-domains="hockeyblackouts.com" data-exclude-hash="true"` on `.com` Umami scripts, `zip-lookup-check` + manual-only `zip-lookup-verdict`, `share-native` / `share-copy-link`, `pwa-prompt-viewed` / `pwa-install-accepted` / `pwa-prompt-dismissed` / `pwa-install-success`, `switch-to-ca` on all `.com` -> `.ca` links, plus `region-lookup-check` + manual-only `region-lookup-verdict` on `.ca/`. | Without `data-domains="hockeyblackouts.com"`, preview URLs pollute `.com` Umami stats; missing ZIP, share, PWA, crosslink, and `.ca` region-lookup events left user flows unmeasured. | Verified locally with Pixel 5 Chromium and `qa_validator.js`; deploy to take effect live. |
| **P1-2** | **FIXED IN REPO (pending deploy)** | `.com` | All 32 `.com` team hubs + `/og/teams/*` | Fixed in `scripts/generate_og_cards.js`, `scripts/generate_us_team_pages.js`, `scripts/build_all.js`, and enforced in `scripts/qa_validator.js`: generated 1200x630 `HockeyBlackouts.com`-branded `build_com/og/default.png` and 32 `build_com/og/teams/<slug>.png` PNGs, removed `.ca` `default.png` overwrite in `build_all.js`, and pointed `.com` team `og:image`/`twitter:image` URLs to `/og/teams/<slug>.png`. | Missing team-specific OG cards reduce social/Discover CTR, and stale image requests hit SPA soft-404 HTML until P0-2 is fixed. | Verified all 33 `build_com/og` 1200x630 PNGs + `qa_validator.js`; deploy to take effect live. |
| **P1-3** | **FIXED IN REPO (pending deploy)** | `.ca` & `.com` | JSON-LD & Security headers; `.ca` explainers | Fixed in `templates/us_splash.html`, `scripts/generate_us_team_pages.js` (`build_com/_headers`), `templates/explainer.html`, and enforced in `scripts/qa_validator.js`: standardized `.com/` `Organization` & `WebSite.publisher` `name` to `"HockeyBlackouts.com"`, added `/*` `Strict-Transport-Security: max-age=31536000; includeSubDomains` + `X-Content-Type-Options: nosniff` to `build_com/_headers`, and added self-referencing `hreflang="en-CA"` + `hreflang="x-default"` to `.ca` explainers. | Consistent `Organization` schema avoids entity splitting; HSTS hardens HTTPS; self-referencing `hreflang` on explainers is cleaner. | Verified in `build_com/_headers`, `build/how-blackouts-work/index.html`, and `qa_validator.js` (note: `.ca` HSTS still requires Cloudflare Dashboard Edge Certificates if desired); deploy to take effect live. |

---

### P2 — Nice to Have

| ID | Status | Site | Affected URL(s) | Observed Evidence | Why It Matters | Concrete Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P2-1** | **FIXED IN REPO (pending deploy)** | `.ca` & `.com` | `/shared/app.js.backup`, `#btnExportPDF`, `/shared/pdf-export.js` | Deleted `shared/app.js.backup`, added `copySharedAssets()` in `scripts/build_all.js` to strip any `*.backup` files from `build/` and `build_com/`, extracted shared lazy PDF generation into `shared/pdf-export.js` (zero initial load cost, preserves `pdf-logo.js`), and added `#btnExportPDF` (`data-umami-event="export-pdf-click"`) + `window.exportPDF` to `.com` team hubs (`templates/us_team.html`, `shared/us-app.js`), enforced in `scripts/qa_validator.js`. | Public backup files leak dead code, while `.com` now offers lazy-loaded PDF schedule export using the shared `/shared/pdf-export.js` + `/shared/pdf-logo.js` pipeline. | Verified in Chromium on both `.ca/toronto/` and `.com/new-york-rangers/` plus `qa_validator.js`; deploy to take effect live. |
| **P2-2** | **OPEN** | `.ca` & `.com` | `https://hockeyblackouts.com/`, `https://hockeyblackouts.ca/fr/montreal/` | Raw `<title>` length on `https://hockeyblackouts.com/` is **72 chars** (`"Where & How to Watch NHL Games in the US \| RSN & ESPN+ Blackouts"` = 68 decoded, 72 raw), and `/fr/montreal/` is **71 chars**. All 32 `.ca` English team hubs pass `<= 70` **decoded** chars (`max=70` for Columbus), though raw HTML has `&amp;` (`78` chars raw). | SERP titles longer than ~60-70 characters risk truncation on Google/Bing. | Trim `templates/us_splash.html` title and `scripts/build_fr.js` Montreal title under 70 characters; optionally shorten `"Where to Watch & Stream..."` on `.ca` so even raw HTML stays `<= 70`. |
| **P2-3** | **FIXED IN REPO (pending deploy)** | `.ca` <-> `.com` | `.ca/` & `.com/` homepages, 32 team hubs, `.com/404.html` | Implemented bidirectional contextual team crosslinking + UTM tracking (`utm_source=hockeyblackouts.ca\|hockeyblackouts.com`, `utm_medium=crosslink`, `utm_campaign=blackout_guide\|blackout_inspector`, `utm_content={nav_switch\|header_switch\|guide_card\|footer_link\|region_lookup_cta}`) and Umami events (`switch-to-us` on `.ca` -> `.com`, `switch-to-ca` on `.com` -> `.ca`) while leaving `<link rel="canonical">` and `hreflang` clean; enforced in `scripts/qa_validator.js`. | Preserves team context across borders and attributes cross-domain referrals cleanly by placement in both `.ca` and `.com` Umami without mutating canonical URLs. | Verified in `build/`, `build_com/`, and `qa_validator.js`; deploy to take effect live. |

---

## 3. What Passed (Verified Live & Locally)

* **Self-Referencing Canonicals & Domain Isolation (Rule 1):** All 32 team hubs + both homepages on `.ca` and `.com`, `/fr/montreal/`, and explainers have exact self-referencing canonicals (`0` cross-domain canonicals; `0` `/us/` paths on `.ca`).
* **Cross-Domain `hreflang` Reciprocity (Rule 2):** All 32 team hubs + homepages on both domains declare reciprocating `en-US` -> `.com`, `en-CA` -> `.ca`, and `x-default` -> `.com`; `/fr/montreal/` declares `fr-CA`/`fr` -> `/fr/montreal/`, `en-CA`/`en`/`x-default` -> `/montreal/`.
* **Metadata, Keyword Intent & Social Cards (Rule 3 / Section C):**
  * All 32 `.ca` English team hubs contain `Watch`, `Stream`, `Tonight`, `Blackouts` in `<title>`, decoded length `<= 70`, meta description `<= 157`, `og:title`/`twitter:title` `<= 59`, `og:description`/`twitter:description` `<= 112`, and `1` `<h1>`.
  * All 32 `.com` team hubs have `<title>` `<= 70`, meta description `<= 156`, `og:title`/`twitter:title` `<= 60`, `og:description`/`twitter:description` `<= 109`, and `1` `<h1>`.
  * Verified `1200x630` PNG OG images (`200 OK`, `image/png`) for `.ca/og/default.png`, `.com/og/default.png`, `.ca/og/teams/toronto.png`, and `192x192` favicons (`200 OK`).
* **`.ca` Document Byte Ceiling & FAQ Tables (Rules 4 & 5):** `.ca` team hubs max out at **124,634 B** (`<= 125 KB`) with `#faq` ending by byte **102,320** (`< 120,000 B`), and every `.ca` and `.com` team hub includes a `<section id="faq">` `<table>`.
* **Clean Initial URL & Separate Umami IDs (Rules 6 & 8):** Mobile Chromium (`Pixel 5`) confirmed `window.location.hash === ""` on untouched load across all 8 tested URLs (`/` + 3 teams on each domain), distinct website IDs (`.ca`: `b68ec99c-ee81-4587-91dc-cd69b239def8`, `.com`: `de005e6e-2c1b-4ecb-8158-7ec341b15192`), and only `1` Umami script request on load.
* **`robots.txt` & IndexNow Key Files (Section A):**
  * `.ca/robots.txt` & `.com/robots.txt` return `200` allowing `/` and pointing to their own sitemaps.
  * `.ca/0e7615e8d257218fdc00d074f25a4247.txt` and `.com/68ca54b3a94f5825cf4f6ca859c94e8f.txt` return `200` matching their exact key names.
* **Trademarks, Disclaimers & Privacy (Rule 9 / Section G):** Visible non-affiliation disclaimer verified in every team hub footer on `.ca` and `.com`; `tests/check_privacy.sh` passed (`✅ Privacy check passed.`); `node scripts/qa_validator.js` exited `0` (`603` `.ca` files, `33` `.com` files).
* **Mobile UX, Accessibility & Core Web Vitals (Section F):** Mobile Chromium (`Pixel 5`, unthrottled local network) on 8 tested pages showed:
  * **LCP:** `104–488 ms` (`.ca`), `204–384 ms` (`.com`)
  * **CLS:** `0` across all 8 pages
  * **TBT:** `0–20 ms`
  * **Overflow:** `false` (`0` horizontal scroll)
  * **Form Labels:** `#regionSelect` (`"Where do you live in Canada?"` / `"Where do you live?"`) and `#zipCodeInput` (`"Enter 5-digit US ZIP code"`) are properly labeled; `67–69` schedule rows hydrated on team hubs (`10`+ rows also prerendered in raw HTML without JS).

---

## 4. Follow-Up Diagnostics (Umami, PWA, Cross-Domain Referrals & Cloudflare)

### A. US Umami Events & PWA Status
1. **Resolved — US Umami Events Wired (`P1-1`):** Initially only `kofi-click` was tracked. `.com` now wires `zip-lookup-check`, manual-only `zip-lookup-verdict`, `export-pdf-click`, `share-native`, `share-copy-link`, `switch-to-ca`, and the full `pwa-prompt-viewed` / `pwa-install-accepted` / `pwa-prompt-dismissed` / `pwa-install-success` funnel, while `.ca/` also tracks `region-lookup-check` + manual-only `region-lookup-verdict` and `switch-to-us`.
2. **Resolved — Unified Event Taxonomy (`shared/us-pwa.js`):** `.com` uses strict lowercase `kebab-case` declarative `data-umami-event` attributes and non-overlapping programmatic `window.trackUsEvent()` calls (injecting `team` via `data-team-code`), matching `.ca`'s schema with zero page-load firing.
3. **Resolved — US PWA Added (`manifest.json` + `/shared/us-pwa.js`):** Generated `build_com/manifest.json` (`id: "/"`) and 32 team `build_com/<slug>/manifest.json` (`id: "/<slug>/"`) manifests with `?utm_source=pwa&utm_medium=homescreen` `start_url`s and `192x192` PNG icons, plus `/shared/us-pwa.js` (`navigator.install()` + `beforeinstallprompt` fallback + `#pwaInstallBanner` + `#directInstallModal`), enforced by `scripts/qa_validator.js`.
4. **Why traffic appeared in `.com` Umami before launch / any `.ca` cross-contamination?**
   * **Zero `.ca` cross-contamination:** Grep across `templates/`, `scripts/`, and `build/` confirms zero `.ca` pages contain `.com`'s Umami ID (`de005e6e-2c1b-4ecb-8158-7ec341b15192`), and zero `build_com/` pages contain `.ca`'s Umami ID (`b68ec99c-ee81-4587-91dc-cd69b239def8`).
   * **Actual cause:** `scripts/generate_us_team_pages.js` (`L15`) omits `data-domains="hockeyblackouts.com"` and `data-exclude-hash="true"`, so pageviews on `https://hockeyblackouts-us.pages.dev/`, preview deployment URLs, or pre-launch/QA browser checks logged directly into `.com` Umami.

### B. `.ca` -> `.com` Referral & Link Tracking
1. **Does `.ca` -> `.com` show up as a referral in `.com` Umami?** **Yes.** Clicking `🇺🇸 Switch to US` (`https://hockeyblackouts.com/`) on `https://hockeyblackouts.ca/` in Chromium landed with `document.referrer === "https://hockeyblackouts.ca/"`. None of the `.ca` -> `.com` links use `rel="noreferrer"`, all `603` files in `build/` lack `<meta name="referrer">`, and `.ca` sends no `Referrer-Policy` HTTP header — so browsers default to `strict-origin-when-cross-origin` and pass the `https://hockeyblackouts.ca/` origin (origin only, not the `.ca` subpage path) under **Referrers** in `.com` Umami.
2. **Resolved — Bidirectional Crosslink UTM + Event Tracking (`P2-3`):** Every `.ca` <-> `.com` link (on `.ca/`, 32 `.ca` English team hubs, `.com/`, 32 `.com` team hubs, `.com/404.html`, and footer explainer links) now carries `utm_source` (`hockeyblackouts.ca` or `hockeyblackouts.com`), `utm_medium=crosslink`, `utm_campaign` (`blackout_guide` or `blackout_inspector`), and placement `utm_content` (`nav_switch`, `header_switch`, `guide_card`, `footer_link`, `region_lookup_cta`) paired with `switch-to-us` / `switch-to-ca` Umami events, while canonical and `hreflang` tags stay parameter-free.

### C. Cloudflare Dashboard vs. Repo Scope (P0-1 Verified Fixed)
1. **Dashboard changes:** **Only P0-1 required the Cloudflare Dashboard**, and it is **verified fixed live** (`http://www.hockeyblackouts.com/` and `/toronto/` both return `301` -> `https://www.hockeyblackouts.com/...` -> `301` -> `https://hockeyblackouts.com/...` -> `200 OK`).
2. **API token scope:** Do **not** widen `CLOUDFLARE_API_TOKEN` in `.github/workflows/deploy-teams.yml` (`L44-L52`, scoped to `Cloudflare Pages: Edit`). **P0-2** (`404.html`), **P0-3** (`pages.dev` `noindex` via `build_com/_headers`), and **P0-4** (externalizing US JS) all deploy via the existing Wrangler Pages deploy step.
3. **Copy-paste `_headers` rule for P0-3 (`build_com/_headers`):**
   ```text
   https://:project.pages.dev/*
     X-Robots-Tag: noindex, nofollow

   https://:version.:project.pages.dev/*
     X-Robots-Tag: noindex, nofollow
   ```

---

## 5. Recommended Submission Order (After P0s Are Fixed)

1. **Fix & deploy remaining P0s (`P0-2` through `P0-7`) + P1s (`P1-1`, `P1-2`, `P1-3`)** — all fixed in repo, rebuilt (`node scripts/build_all.js`), and verified via `npm run test:all`; deploy next and verify live via `curl`:
   * `hockeyblackouts.com/nonexistent-test/` returns **`404`** (not `200`).
   * `hockeyblackouts-us.pages.dev/` returns **`X-Robots-Tag: noindex, nofollow`**.
   * All `.com` team hubs are **`< 125 KB`**.
   * All `.ca` `/game/` links return **`200`**, `.ca` `FAQPage` JSON-LD matches `#faq`, and `.ca/sitemap.xml` lists all **32** teams (`<= 80` total URLs).
2. **Google Search Console:**
   * Verify Domain property for `hockeyblackouts.ca` -> Submit `https://hockeyblackouts.ca/sitemap.xml`.
   * Run **URL Inspection -> Test Live URL** on `.ca/`, `.ca/toronto/`, `.ca/boston-bruins/`, and one `/game/...` URL.
   * Verify Domain property for `hockeyblackouts.com` -> Submit `https://hockeyblackouts.com/sitemap.xml`.
   * Run **URL Inspection -> Test Live URL** on `.com/`, `.com/new-york-rangers/`, `.com/toronto/`, plus a nonexistent path to confirm Google sees `404`.
3. **Bing Webmaster Tools:**
   * Import both verified properties from Google Search Console (`Import from GSC`).
   * Confirm both sitemaps are accepted and inspect one `.ca` and one `.com` team hub to confirm Bing indexes past `#faq` without truncation.
4. **IndexNow (Last):**
   * Confirm both live key files return `200`, run a one-time submission of `.com`'s core `33` URLs (`/` + 32 teams), and keep daily cron-only submissions for `.ca` (never trigger IndexNow on `git push`).
