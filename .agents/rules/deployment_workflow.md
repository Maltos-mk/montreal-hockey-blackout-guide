# Deployment Workflow & Playbook

This standard operating procedure ensures all changes are safely tested and verified before reaching production.

## 1. Sync
- **Action:** Ensure the local repository is up to date with the remote before starting work (`git pull`).
- **Nuance:** If working across multiple machines, this prevents merge conflicts and ensures we are building on the latest production state.

## 2. Local Development & Testing
- **Action:** Make changes locally. Run a local server (e.g., `python3 -m http.server 8000`) and rigorously test the changes.
- **Nuance (Data vs UI):** 
  - *Data Updates (JSON):* Verify JSON syntax and ensure the app parses it without errors.
  - *UI/Logic Updates:* Use a browser subagent to visually verify layout, interactive elements, and console errors.

## 3. User Review (Local Approval)
- **Action:** Show the working local version to the user (via `localhost` link and screenshots/descriptions).
- **Nuance:** Do not commit or push to production until explicit approval is received from the user on the local state.

## 4. Promote & Deploy
- **Action:** Once approved, commit the changes with a clear, descriptive message and push to `main` (`git add -A && git commit -m "..." && git push`).
- **Nuance:** The GitHub Actions CI/CD pipeline will automatically build and distribute the updates to the respective production environments (`gh-pages` and external repos).

## 5. Rollback Procedure
- **Action:** If a production deployment fails or introduces a critical bug, immediately run `git revert HEAD` and push to restore the previous stable state before debugging.
