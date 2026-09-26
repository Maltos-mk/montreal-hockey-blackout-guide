const fs = require('fs');

let content = fs.readFileSync('/Users/keithrobinson/.gemini/antigravity/brain/11a8722c-19c5-40d8-8b6f-f61d48038220/marketing_strategy.md', 'utf-8');

const vpnPlay = `### The VPN Angle (High Value)
*   **The Play:** The most common solution to regional blackouts is a VPN. 
*   **Execution:** Add a small "Bypass Blackouts" text link at the bottom of the advice cards. Route it to a NordVPN or ExpressVPN affiliate link. VPN bounties are incredibly lucrative (often $30+ per signup). It solves the user's problem directly without plastering the site in display ads.`;

const updatedVpnPlay = `### The VPN Angle (High Value)
*   **The Play:** The most common solution to regional blackouts is a VPN. 
*   **Execution:** Add a small "Bypass Blackouts" text link at the bottom of the advice cards. Route it to a VPN affiliate link. It solves the user's problem directly without plastering the site in display ads.
*   **NordVPN Affiliate Details:** Highly recommended. They offer a staggering **100% commission** on 1-month signups, and 40% on 1/2-year plans. More importantly, they offer a **30% recurring revenue share** on all renewals.
*   **ExpressVPN Affiliate Details:** Operates on a flat CPA (Cost Per Acquisition) model. You get $13 for a 1-month sign-up and up to $36 for an annual sign-up. There are no recurring commissions.`;

const snPlay = `### Sportsnet+ Affiliate
*   **The Play:** Check if Rogers/Sportsnet operates a direct affiliate network via platforms like CJ Affiliate or ShareASale. If they pay bounties for Sportsnet+ Premium signups, swap your raw links for tracking links.`;

const updatedSnPlay = `### Sportsnet+ Affiliate (Not Viable)
*   **The Reality:** Neither Sportsnet (Rogers) nor TSN (Bell) operate public affiliate programs on major networks like CJ Affiliate or ShareASale. They only handle high-level corporate sponsorships. You cannot monetize direct sign-ups to their streaming services. You are better off pushing the Amazon Prime and VPN affiliate links.`;

content = content.replace(vpnPlay, updatedVpnPlay);
content = content.replace(snPlay, updatedSnPlay);

fs.writeFileSync('/Users/keithrobinson/.gemini/antigravity/brain/11a8722c-19c5-40d8-8b6f-f61d48038220/marketing_strategy.md', content);
