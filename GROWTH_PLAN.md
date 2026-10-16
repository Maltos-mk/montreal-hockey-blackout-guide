# HockeyBlackouts.ca — Growth Plan (SEO + Monetization)

Working doc. Source: competitor review of whereisthegame.com plus feedback from an SEO expert persona and a monetization specialist persona (2026-10-13).

**How to use:** Check items off as they ship. Bug fixes follow the STATUS.md rule: write a failing test first, then fix. Keep this file out of STATUS.md (STATUS.md stays short).

---

## Open Decisions (Resolved)

- [x] **D1. Trademark rule scope.** **LOCKED IN:** Descriptive team names are permitted in page titles, meta descriptions, and content to capture organic search traffic ("Canadiens game tonight"). Trademarks remain strictly banned from **domains, brand names, and URL slugs**. A visible non-affiliation disclaimer is required in the footer.
- [x] **D2. Past-game page policy.** **LOCKED IN (Option A):** Keep game pages indexed with the final broadcast result for 14–21 days post-game. Drop from `sitemap.xml` after day 7. At day 21, issue a permanent **301 redirect to the home team's hub page** (e.g. `/toronto/`). This funnels all earned backlink equity into the main page, prevents index bloat/crawl waste, and stops cannibalization.
- [x] **D3. Analytics & Ad Networks.** **LOCKED IN:** Remain Umami-only for the current phase (preserves the fast, privacy-first brand). Postpone GA4 and display ad networks until per-game programmatic pages scale real visits to 25k–50k/mo.

---

## Phase 1 — Fix What's Broken & Compliance

- [x] **1.0 Fix artificial pageview inflation.** Added `data-exclude-hash="true"` to Umami script in `templates/index.html` and `templates/splash.html` and added assertion in `qa_validator.js`. State toggles no longer flood analytics.
- [x] **1.1 Schedule invisible to crawlers.**
  - Added automated test in `scripts/qa_validator.js` failing if any built team page is missing prerendered HTML schedule content.
  - Updated `scripts/build.js` and `templates/index.html` to prerender all 84 games into both desktop `<table>` rows and mobile card views at build time with national/regional access badges.
  - Verified: client-side JS (`shared/app.js`) seamlessly hydrates filters and dropdowns when loaded, but raw HTML now provides immediate static content for Googlebot, Bing, and AI Overviews.
- [x] **1.2 CBC pruned from data & contract logic.**
  - Added automated test in `scripts/matrix_test.js` checking that no Canadian team lists CBC or CityTV in `nationalEN` networks or schedule broadcasts.
  - Pruned `"CBC"` from `nationalEN` across all `data/*.json` files.
  - Updated `quickSummary` templates in `scripts/build.js` and the FAQ table in `templates/index.html` to remove stale CBC references.
  - Verified: all 1,000+ matrix permutations pass.
- [x] **1.3 Trademark in titles & fair use disclaimer.**
  - Narrowed rule in `STATUS.md`: descriptive nominative use is allowed in titles/descriptions ("Canadiens TV Schedule") to capture organic traffic, while trademarks remain strictly banned from domains, brands, and slugs.
  - Verified presence of visible non-affiliation disclaimer in `templates/index.html` footer.
- [x] **1.4 Subfolder robots.txt files.**
  - Removed redundant per-team `robots.txt` files from `teams/*/` and `scripts/build.js` (crawlers only honor root `robots.txt`).
  - Added test in `scripts/qa_validator.js` that fails if any subfolder in `build/` contains a `robots.txt`.
- [x] **1.5 Outbound affiliate link compliance (`rel="sponsored"`).**
  - Updated Amazon Prime free trial links (`maltos-20`) in `templates/index.html` to `rel="sponsored noopener noreferrer"`.
  - Added automated test in `scripts/qa_validator.js` that scans all built HTML pages to verify all `amazon.ca` links include `rel="sponsored"`.
  - Verified: Ko-fi donation links remain standard `rel="noopener noreferrer"` (Google guidelines do not require `rel="sponsored"` on non-commercial donations).

---

## Phase 2 — Per-Game Pages (main traffic engine)

Architectural specs verified by SEO/SEM and UX design personas (2026-10-14).

- [x] **2.1 URL scheme & Canonical:**
  - Route: `/game/{YYYY-MM-DD}/{home-city}-vs-{away-city}/` (e.g. `/game/2026-10-15/toronto-vs-montreal/`).
  - Slugs use **city names only** (zero trademarks: no "leafs", "canadiens", "habs", etc.).
  - Canada-vs-Canada duplicates prevented: canonical maps to home team ice.
- [x] **2.2 SEO & Meta Blueprint:**
  - **Title Tag (<60 chars):** `Where to Watch [Away] vs [Home] Tonight: TV & Stream Guide`
  - **Meta Description (<155 chars):** `Watch [Away] vs [Home] on [Date]. Find live TV channels, streaming options, and blackout rules across Canada.`
  - Social Cards: OG title, description, and canonical tags fully populated on all 547 games.
- [x] **2.3 Schema.org JSON-LD Blueprint:**
  - Compliant `@graph` nesting `SportsEvent` (competitors, Canadian venue, date), `publication` → `BroadcastEvent` → `BroadcastService` (linear + streaming channels).
  - Explicitly omitted `Offer` with `price: 0` (avoids Google Rich Result warning flags).
  - Structured `FAQPage` JSON-LD answering *"What channel is [team] vs [team] on tonight in Canada?"*.
- [x] **2.4 Above-the-Fold UX ("3-Second Verdict"):**
  - Instant mobile-friendly verdict card (`bg-slate-900 border border-white/10 rounded-2xl`): Start time with auto-converted local timezone, matchup codes in `font-teko`, and prominent status badge (Emerald: Watchable, Amber: Blacked Out).
  - Horizontal scrollable quick-region pills (`ON West | QC & East | Prairies | BC | Overlap`) that instantly toggle regional advice in-memory.
- [x] **2.5 Content Hierarchy & Anti-Thin Depth:**
  - 7-zone Canadian regional blackout breakdown table (In-Market vs Out-of-Market, English/French networks).
  - Fallback grid: Official radio callsign & live audio stream link, legal Prime Video 30-day trial card (`rel="sponsored"`), and local sports pub sponsorship placeholder.
  - Internal navigation mesh: Breadcrumbs (`Home > Toronto > vs Montreal`), links to both team full schedules, and Prev/Next game pagination.
- [x] **2.6 Sitemaps & Build Integration:**
  - 547 unique matchups generated at build time via `scripts/build_game_pages.js`.
  - Integrated into `scripts/build_all.js` and added to master `build/sitemap.xml`.
- [x] **2.7 Automated QA Suite:**
  - `qa_validator.js` updated to recursively scan all 555 HTML files: verifies canonicals, description lengths, SportsEvent schema, BroadcastEvent schema, and validates that URL slugs contain zero trademarked team nicknames. All 555 pages passed.

---

## Phase 3 — Hubs, Internal Linking & Site Stabilization

Stabilize core site architecture, internal linking mesh, and search authority before expanding into localization.

- [x] **3.1 Hub-and-Spoke Internal Mesh (Team Pages as Primary Destination):**
  - Game pages channel all navigation and equity into the primary Canadian team hub(s) (no distracting horizontal game pagination).
  - Clear "View Full 84-Game [Team] Guide & Blackout Matrix" primary CTA on every game page.
- [x] **3.2 "Today's Situation" freshness summary:**
  - Dynamic game-day broadcast status rendered at build time with visible "Schedule verified: {date}" stamp and matching `dateModified` in schema for freshness signals.
- [x] **3.3 Game-Night Discovery & Upcoming Spotlights:**
  - Splash page (`/`): Dynamic "Tonight's Canadian Matchups" / "Next Up" spotlight section linking directly to team guides.
  - Team hubs: Quick "Next 3 Games" spotlight banner at the top of the schedule so mobile users get tonight's verdict instantly without scrolling the full 84-game table.
- [x] **3.4 Evergreen explainer hubs:**
  - Dedicated programmatic landing pages for high-volume evergreen queries: `/sportsnet-plus-blackout-rules/`, `/prime-hockey-schedule-canada/` (with all 28 Canadian Prime matchups + free trial CTA), and `/rds-vs-tva-sports-blackouts/`.
- [x] **3.5 Trust & E-E-A-T signals:**
  - Dedicated `/how-blackouts-work/` territory map & methodology page explaining Canadian broadcast boundary contracts, Belleville–Kingston & Prairie overlap zones, automated data verification, and corrections contact link.
- [x] **3.6 IndexNow protocol integration:**
  - Auto-ping IndexNow API on daily builds for instant discovery by Bing, Yahoo, and Microsoft Copilot.
- [ ] **3.7 Core Web Vitals (CWV) & Performance:**
  - Ensure Largest Contentful Paint (LCP) on verdict card text stays well under 1.2s on mobile.

---

## Phase 4 — French Market (Quebec / Francophone Broadcasts)

Deferred until English feature set and site architecture are fully stabilized. Requires authentic Quebec hockey terminology rather than mechanical machine translation.

- [ ] **4.1 Native French Hubs:**
  - Ship `/fr/montreal/` and `/fr/ottawa/` with tailored copy respecting RDS/TVA Sports rights and regional broadcast nuances.
- [ ] **4.2 Reciprocal `hreflang` tags:**
  - Correct bidirectional `hreflang` markup (`en-CA`, `fr-CA`, `x-default`) across corresponding team hubs.
- [ ] **4.3 French Matchup Pages:**
  - Programmatic French matchup pages for Canadiens and Senators games once hub stability is proven.

---

## Phase 5 — Monetization

Reality check: True traffic is ~15k visits/month (single-page utility usage). Display ads are effectively pointless right now (~$30/mo) and would ruin the clean PWA experience. Focus strictly on contextual, high-value monetization and audience ownership.

- [x] **5.1 Amazon Prime Affiliate (`maltos-20`):** Free 30-day trial referral for Prime Monday Night Hockey games. Already compliant with `rel="sponsored noopener noreferrer"`.
- [ ] **5.2 "Kept Free Out of Spite" Ko-fi Tip Jar:** Canadian fans hate telecom blackout monopolies. Position the tip jar not as charity, but as supporting an ad-free indie alternative ("Built out of spite for Canadian regional blackouts. Kept fast, private, and ad-free. Buy the dev a beer"). *Expectation: ~$50-$150/mo.*
- [ ] **5.3 Personalized "Blackout-Proof" Calendar Feed ($5/season Micro-SaaS):**
  - Dynamic .ics / Google Calendar link that only syncs games viewable in the user's specific postal code/region with exact TV channels attached to calendar alerts.
  - One-time $5 season pass via Stripe checkout.
  - *Expectation: ~$250-$500/season from die-hards.*
- [ ] **5.4 Hyper-Local Pub & Sports Bar Lead Gen:**
  - When a game is blacked out at home, feature a local neighbourhood pub card: *"Blacked out at home? Catch the game at [Featured Pub]."*
  - Charge local establishments a flat fee ($50-$100/mo) per metro region via a Stripe sponsor link.
  - *Expectation: ~$150-$300/mo.*
- [ ] **5.5 Free push alerts:** ("Your team is on national TV / blacked out tonight") — purely for retention and daily active users.
- [ ] **5.6 Weekly newsletter (beehiiv):** Owned audience channel for season blackout updates.
- [ ] **5.7 Display ads (DEFERRED):** Revisit only if traffic reaches 25k-50k real visits/mo via per-game programmatic SEO.

### Hard No
- Secondary Ticket Affiliates (unrealistic conversion journey for TV blackout lookup; poor CVR/CTR)
- Over-The-Air (OTA) Antennas (irrelevant under 2026 contracts as CBC/Citytv no longer broadcast games)
- VPN affiliates (ToS circumvention, legal-letter magnet, kills neutrality)
- Betting affiliates (AGCO registration, identity, brand conflict)
- Fubo/DAZN promotion (no NHL Canada rights — misleading)
- Any ad above the verdict

### Anonymity & Compliance Notes
- All affiliate links (Amazon, etc.) must have `rel="sponsored"`.
- Ko-fi tip links do not need `rel="sponsored"`, standard `rel="noopener noreferrer"` is fine.

---

## Parked / Rejected
- Secondary ticket affiliates (SeatGeek, StubHub) — ~0.5% CTR and 1% CVR yielding ~$15-$35/mo at current traffic. Unrealistic buyer mindset.
- OTA Antennas — CBC/Citytv no longer hold OTA free rights under 2026 broadcast contracts.
- `SportsEvent` + `Offer` schema for rich results — no SERP feature for TV listings; misleading price markup.
- Mediavine as a near-term goal — traffic threshold + GA4 requirement.
- "My Games" localStorage favourites — nice UX, zero SEO value. Low priority.
- Meta keywords — ignored by Google.
