# Maltos NHL Blackout Guides

An independent, real-time broadcast and blackout calculator for Canadian NHL fans. 

This repository contains the core logic, build scripts, and templates used to generate a suite of highly-optimized Progressive Web Apps (PWAs). The engine ingests official NHL API schedule data and mathematically cross-references it against complex regional broadcast boundaries to output tailored, blackout-free viewing advice.

## Live Production Guides
* [Vancouver Canucks Guide](https://maltos-mk.github.io/vancouver-hockey-blackout-guide/)
* [Calgary Flames Guide](https://maltos-mk.github.io/calgary-hockey-blackout-guide/)
* [Edmonton Oilers Guide](https://maltos-mk.github.io/edmonton-hockey-blackout-guide/)
* [Winnipeg Jets Guide](https://maltos-mk.github.io/winnipeg-hockey-blackout-guide/)
* [Toronto Maple Leafs Guide](https://maltos-mk.github.io/toronto-hockey-blackout-guide/)
* [Ottawa Senators Guide](https://maltos-mk.github.io/ottawa-hockey-blackout-guide/)
* [Montreal Canadiens Guide](https://maltos-mk.github.io/montreal-hockey-blackout-guide/)

## Architecture Overview
* `data/`: Raw JSON schedule data pulled from the NHL API.
* `scripts/`: Node.js build pipeline that generates the static sites.
* `shared/`: The frontend logic (UI, Umami telemetry, evaluation engine).
* `templates/`: The master HTML template injected with SEO-optimized publisher schema.

## Local Development
1. Install dependencies: `npm install`
2. Fetch latest schedules: `node scripts/fetch_2026_season.js`
3. Generate all sites: `node scripts/build.js`
4. Run preview server: `node scripts/serve_prod.js toronto`

## License
The codebase is open-sourced under the MIT License by Maltos. 
*Disclaimer: Unofficial fan resource. Not affiliated with the NHL.*
