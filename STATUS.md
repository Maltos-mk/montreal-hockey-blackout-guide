# HockeyBlackouts.ca - Project Knowledge & Status

**Project Status:** Active Development / QA Hardening Phase

## CRITICAL AGENT INSTRUCTIONS (READ FIRST)
1. **Test-Driven Bug Fixing:** If the user reports a bug, YOU MUST write or update an automated test (e.g. in `matrix_test.js` or `qa_validator.js`) that physically reproduces the bug and fails, *BEFORE* attempting to fix the source code.
2. **Build Architecture:** NEVER edit files in the `build/` directory. They are auto-generated and will be wiped. Always edit `templates/` and run `node scripts/build_all.js`.
3. **Identity & Privacy:** The author is "Maltos". The brand is "HockeyBlackouts.ca". Never use NHL trademarks (NHL, Canadiens, etc.) in domains, brand names, or URL slugs to avoid C&D letters. Descriptive nominative use (e.g. "Montreal Canadiens TV schedule") is allowed in page titles, descriptions, and content, provided a clear "Not affiliated with the NHL or any team" disclaimer is visible in the footer. Never expose the name "Keith" in commits. Commits must use the anonymous GitHub noreply email.

## Automated QA Suite
We rely on a unified testing suite to prevent regressions. Before committing *any* code, run:
`npm run test:all`

This suite sequentially runs:
1. `check_privacy.sh`: Ensures no PII (like real names) are in the codebase.
2. `matrix_test.js`: Validates 1,000+ permutations of the boolean blackout engine.
3. `qa_validator.js`: Validates SEO, canonical links (must be `https://hockeyblackouts.ca`), and schema structure on generated HTML.
4. `playwright test`: Launches headless browser to simulate user clicks on streamers/regions, verifies reactive DOM updates, and catches any unhandled runtime exceptions in the browser console.

## Domain Logic Quirks
*   **84-Game Schedule:** The NHL schedule is 84 games.
*   **Sportsnet vs. Sportsnet+:** While regional rules are identical, SN+ streaming has ~10 exclusive national games per team that linear cable does not. Ensure the engine treats them separately.
*   **CBC/CityTV:** Under the 2026 contracts, they no longer broadcast free over-the-air games. Do not classify them as free national broadcasters.

## UX, SEO & Analytics Invariants
*   **AI Overviews (SGE):** The `FAQPage` JSON-LD schema must exactly match the visible HTML in the FAQ section. The FAQ section must contain a structured `<table>` summary.
*   **HTML Byte Ceiling (< 120 KB):** Team hub HTML (`build/{team}/index.html`) must stay under 120 KB (prerender only the next 10 upcoming games in static HTML while `shared/app.js` hydrates all 84 games on the client) so Bingbot does not truncate the document before `<section id="faq">`.
*   **Protected `<title>` Keywords:** English team hub `<title>` tags must stay `<= 70` chars while preserving all four core query tokens: `Watch`, `Stream`, `Tonight`, and `Blackouts`.
*   **Rolling Sitemap & Cron-Only IndexNow:** `build/sitemap.xml` must stay `<= 80` URLs (core hubs/explainers + rolling `-7d` to `+14d` `/game/` window) with `<lastmod>`. IndexNow (`scripts/ping_indexnow.js`) must only run on daily cron (`schedule`), never on code `push`.
*   **Clean Initial-Load Canonical URL:** `updateHash()` in `shared/app.js` must leave `window.location.hash` empty (`""`) on untouched default page loads so crawlers only index the clean canonical URL.
*   **Declarative-Only Umami Events:** Never combine `data-umami-event` HTML attributes with manual `window.umami.track()` click listeners on the same element, and never fire conversion/click events automatically on page load.
