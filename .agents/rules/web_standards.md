# Web Development SOP (Standard Operating Procedure)

## Iconography & Visual Assets
- **Favicons:** Use inline SVG data URIs or pure SVGs for favicons (`favicon.svg`) to guarantee zero-latency rendering and eliminate missing asset errors on CDNs.
- **iOS Support:** Always pair with an Apple Touch Icon (`<link rel="apple-touch-icon">`) for iOS home screens.

## SEO & Structured Data
- **Meta Tags:** Inject complete OpenGraph (`og:title`, `og:image`, `og:url`) and Twitter card tags.
- **Schema.org:** Include structured data in `<head>` (e.g., `WebApplication` schema declaring categories/browser requirements, `FAQPage` schema for direct Google search snippet answers).
- **Keywording Balance:** Use colloquial, high-traffic terms organically within meta tags, FAQ copy, and explanatory content while maintaining neutral, descriptive page titles to avoid trademark friction.

## PWA & Non-Intrusive UX
- **Display:** Support `standalone` display mode via `manifest.json`.
- **Installation Handling:** Never fire disruptive native prompts on desktop. Mobile-only prompts must detect iOS Safari and present clean visual steps (Share icon [↑] -> "Add to Home Screen").
- **Frequency Suppression:** Persist user dismissals in `localStorage` (`pwa_prompt_dismissed`) to silence prompts for at least 14 days or permanently upon installation.

## Analytics & Privacy
- **Integration:** Integrate privacy-first analytics (Umami Cloud). 
- **Event Tracking:** Use client-side `data-umami-event` attributes for tracking CTA clicks (e.g., affiliate links, tip jars, PWA installs) without third-party tracking cookies.

## SEO Hygiene
- Every site must deploy with a valid, accessible `sitemap.xml` and `robots.txt` in the root directory.
- Must be registered in Google Search Console with verification tags in `<head>`.

## Architecture & State
- **Multi-Tenant Abstraction:** Separate generalized UI engines (`app.js`) from volatile business logic (`blackout.js`) and data payloads (`data.json`). This allows multiple properties to run off a single, highly cacheable master codebase.
- **URL Serialization (Deep Linking):** Map volatile UI state (checkboxes, filters) into the URL Hash (`window.location.hash`) automatically. This allows users to share deep-links that preserve their exact filter states without a backend database.
- **Date/Time Localization:** Never hardcode timestamps. Pass UTC ISO 8601 strings to the client and use `Intl.DateTimeFormat` to automatically localize times to the user's browser timezone.

## Testing & Automation
- **End-to-End (E2E) DOM Testing:** Do not rely solely on data/math unit tests. Integrate a headless browser framework (e.g., Playwright) in CI/CD to emulate user clicks and assert DOM nodes render correctly to catch invisible UI regressions.
- **API Automation:** Use chron jobs (GitHub Actions) to automatically ping upstream data sources (e.g., NHL API) to sync and patch local JSON payloads without overwriting custom metadata.

## Social & Sharing
- **Web Share API Fallbacks:** When invoking `navigator.share()`, omit the `text` payload. If included, native iOS/Android "Copy Link" buttons will concatenate the text and URL, breaking the copied link.
- **Desktop Clipboard:** If `navigator.share()` is unsupported (desktop), gracefully fallback to `navigator.clipboard.writeText()` with a toast notification, rather than triggering an error alert.
