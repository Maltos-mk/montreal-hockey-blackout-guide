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
