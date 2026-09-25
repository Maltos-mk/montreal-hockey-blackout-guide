const fs = require('fs');

const additions = `
## Architecture & State
- **Multi-Tenant Abstraction:** Separate generalized UI engines (\`app.js\`) from volatile business logic (\`blackout.js\`) and data payloads (\`data.json\`). This allows multiple properties to run off a single, highly cacheable master codebase.
- **URL Serialization (Deep Linking):** Map volatile UI state (checkboxes, filters) into the URL Hash (\`window.location.hash\`) automatically. This allows users to share deep-links that preserve their exact filter states without a backend database.
- **Date/Time Localization:** Never hardcode timestamps. Pass UTC ISO 8601 strings to the client and use \`Intl.DateTimeFormat\` to automatically localize times to the user's browser timezone.

## Testing & Automation
- **End-to-End (E2E) DOM Testing:** Do not rely solely on data/math unit tests. Integrate a headless browser framework (e.g., Playwright) in CI/CD to emulate user clicks and assert DOM nodes render correctly to catch invisible UI regressions.
- **API Automation:** Use chron jobs (GitHub Actions) to automatically ping upstream data sources (e.g., NHL API) to sync and patch local JSON payloads without overwriting custom metadata.

## Social & Sharing
- **Web Share API Fallbacks:** When invoking \`navigator.share()\`, omit the \`text\` payload. If included, native iOS/Android "Copy Link" buttons will concatenate the text and URL, breaking the copied link.
- **Desktop Clipboard:** If \`navigator.share()\` is unsupported (desktop), gracefully fallback to \`navigator.clipboard.writeText()\` with a toast notification, rather than triggering an error alert.
`;

let content = fs.readFileSync('.agents/rules/web_standards.md', 'utf-8');
content += additions;
fs.writeFileSync('.agents/rules/web_standards.md', content);
