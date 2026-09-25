---
name: privacy_and_anonymity
description: Enforces user anonymity across git and deployments
---

# Privacy and Anonymity

Never use the user's real name ("Keith", "Keith Robinson") or personal email address in any generated code, documentation, Git commit history, or deployment scripts.

- Use the pseudonym `Maltos-mk` for authorship, usernames, and organization names.
- Use `bot@maltos-mk.com` for any required email addresses (e.g., inside GitHub Actions workflows or Git configuration).
- Scrub any generated paths that leak the user's local filesystem structure (e.g. `/Users/keithrobinson/...`) before pushing to public repositories.
