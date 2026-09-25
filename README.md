# Hockey Broadcast & Blackout Guides

This repository contains the core logic, UI engine, and data files for independent NHL blackout guides. The architecture is designed to support deploying multiple independent single-page Progressive Web Apps (PWAs) from a single shared codebase.

## Architecture

*   **`shared/`**: Contains the core `app.js` UI rendering engine, Tailwind configurations, and common assets. This logic is identical across all teams.
*   **`teams/<team>/`**: Contains team-specific overrides, specifically the `blackout.js` ruleset, PWA `manifest.json`, `favicon.svg`, and the `index.html` shell.
*   **`data/<team>.json`**: The raw JSON schedule and broadcast data for the team.
*   **`scripts/`**: Automation scripts (e.g., `update_times.py` which hits the NHL API to adjust game times automatically).
*   **`tests/`**: Contains `verify_build.js`, which runs a Truth Matrix against the team logic before allowing deployment.

## How to Scaffold a New Team

When adding a new team (e.g., Ottawa Senators), follow this exact checklist:

1. **Create the Data File (`data/ott.json`)**
   Create the JSON schedule payload. Ensure every game has the required keys: `id`, `date`, `time`, `iso`, `opponent`, `isHome`, `venue`, `netEN` (or `netFR`), and `type`.
2. **Create the Team Directory (`teams/ottawa/`)**
   Copy an existing team folder (like `teams/montreal/`) and scrub all previous team references. 
   - Update `index.html` with proper SEO keywords, canonical URLs, and a new Umami tracking ID.
   - Update `manifest.json` with the new short name ("Sens Guide") and brand colors.
   - Create a new `favicon.svg` with the team's colors and initial.
3. **Write the Blackout Logic (`teams/ottawa/blackout.js`)**
   Implement the `evaluateGame(g, state)` function to process the regional territory logic specific to that team's broadcasting rights (e.g., TSN5 vs Sportsnet East).
4. **Update the Truth Matrix (`tests/verify_build.js`)**
   Add a strict unit test verifying that an out-of-market or in-market configuration accurately evaluates a sample game against the new `blackout.js` rules.
5. **Update the Deployment Pipeline (`.github/workflows/deploy-teams.yml`)**
   Duplicate the `deploy-toronto` job block. Update the paths to copy `teams/ottawa/*` and `data/ott.json`, and set the `destination-repository-name` to the new GitHub Pages repo.
6. **Deploy**
   Commit to `main`. The GitHub Action will run the tests, compile the standalone PWA into a temporary `build/` directory, and push it directly to the target repo.

## Features

*   **Offline Support / PWA:** The UI prompts mobile users to install the app to their home screen after 3 seconds. It uses `localStorage` to track dismissal state.
*   **Local Time Zones:** `app.js` automatically parses UTC `iso` timestamps and displays game times in the user's native local timezone via `Intl.DateTimeFormat`.
*   **Shareable Configurations:** The UI serializes user checkbox and region state into the URL hash (`/#region=in_market&sn=true`), ensuring shared links preserve the exact blackout filter the user configured.
*   **Auto Schedule Sync:** A GitHub Action runs daily at 8AM UTC to hit the official NHL API and safely update `iso` times for any games that have been rescheduled.
