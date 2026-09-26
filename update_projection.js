const fs = require('fs');

let content = fs.readFileSync('/Users/keithrobinson/.gemini/antigravity/brain/11a8722c-19c5-40d8-8b6f-f61d48038220/marketing_strategy.md', 'utf-8');

const projection = `*   **Total Realistic Baseline:** $100 - $300 per month.`;

const updatedProjection = `*   **NordVPN Affiliate:** Assuming 10,000 monthly visits, a conservative 0.5% conversion rate yields 50 signups. At a blended average of $15 commission per sign-up (mix of 100% 1-month bounties and 40% annual bounties), expect $150 - $750/month in initial payouts, plus a compounding 30% recurring lifetime tail.
*   **Total Realistic Baseline (with VPN):** $250 - $1,050 per month.`;

content = content.replace(projection, updatedProjection);

fs.writeFileSync('/Users/keithrobinson/.gemini/antigravity/brain/11a8722c-19c5-40d8-8b6f-f61d48038220/marketing_strategy.md', content);
