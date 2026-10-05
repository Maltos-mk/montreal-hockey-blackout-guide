# HockeyBlackouts.ca - Project Knowledge & Status

**Project Status:** Active Development / QA Hardening Phase

## CRITICAL AGENT INSTRUCTIONS (READ FIRST)
1. **Test-Driven Bug Fixing:** If the user reports a bug, YOU MUST write or update an automated test (e.g. in `matrix_test.js` or `qa_validator.js`) that physically reproduces the bug and fails, *BEFORE* attempting to fix the source code.
2. **Build Architecture:** NEVER edit files in the `build/` directory. They are auto-generated and will be wiped. Always edit `templates/` and run `node scripts/build_all.js`.
3. **Identity & Privacy:** The author is "Maltos". The brand is "HockeyBlackouts.ca". Never use NHL trademarks (NHL, Canadiens, etc.) in domains or page titles to avoid C&D letters. Never expose the name "Keith" in commits. Commits must use the anonymous GitHub noreply email.

## Automated QA Suite
We rely on a unified testing suite to prevent regressions. Before committing *any* code, run:
`npm run test:all`

This suite sequentially runs:
1. `check_privacy.sh`: Ensures no PII (like real names) are in the codebase.
2. `matrix_test.js`: Validates 1,000+ permutations of the boolean blackout engine.
3. `qa_validator.js`: Validates SEO, canonical links (must be `https://hockeyblackouts.ca`), and schema structure on generated HTML.

## Domain Logic Quirks
*   **84-Game Schedule:** The NHL schedule is 84 games.
*   **Sportsnet vs. Sportsnet+:** While regional rules are identical, SN+ streaming has ~10 exclusive national games per team that linear cable does not. Ensure the engine treats them separately.
*   **CBC/CityTV:** Under the 2026 contracts, they no longer broadcast free over-the-air games. Do not classify them as free national broadcasters.

## UX & Monetization Rules
*   **Ko-fi Placement:** Do not place large Ko-fi or donation banners above the main schedule table. Keep them below the schedule to avoid interrupting the core user experience.
*   **AI Overviews (SGE):** The `FAQPage` JSON-LD schema must exactly match the visible HTML in the FAQ section. The FAQ section must contain a structured `<table>` summary.
