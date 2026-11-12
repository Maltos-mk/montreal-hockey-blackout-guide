// E2E QA matrix for the blackout engine (CA + US sites).
// Runs against the local build/ directory (served by playwright.config.js webServer on :8099).
//   CA site pages:  /<team>/       (region <select>, Sportsnet / TSN / RDS rules)
//   US site pages: build_com/ served at http://localhost:8100/<team>/ (ZIP <input>, ESPN+ / RSN / national exclusives)
//
const US_SITE = 'http://localhost:8100'; // build_com/ (hockeyblackouts.com), see playwright.config.js

// Counts are read from the live DOM and compared relatively, so the suite keeps
// working when the schedule data is refreshed. Nothing here is hardcoded to a game total.
const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Never send telemetry from tests.
  await page.route('**/*umami*', route => route.abort());
  page.on('pageerror', err => {
    throw new Error(`[BROWSER UNCAUGHT EXCEPTION] ${err.message}`);
  });
});

// ---------- helpers ----------
const readInt = async (locator) => parseInt((await locator.textContent()).trim(), 10);
const watchable = (page) => readInt(page.locator('#watchableCount'));
const blackedOut = async (page) =>
  parseInt((await page.locator('#blackoutBreakdown').textContent()).trim(), 10); // "12 games (14%)"
const totalGames = async (page) => {
  const m = (await page.locator('#totalGameLabel').textContent()).match(/\d+/);
  return parseInt(m[0], 10);
};

async function openTeam(page, path) {
  await page.goto(path);
  await page.waitForSelector('#scheduleTableBody tr');
}

async function submitZip(page, zip) {
  await page.locator('#zipCodeInput').fill(zip);
  await page.locator('#zipLookupBtn').click();
}

/** Subscription checkbox with its label text, e.g. sub('sub_us_rsn'). */
const sub = (page, id) => page.locator(`#subsList label:has(#${id})`);

// =====================================================================
// 1. US In-Market (RSN)
// =====================================================================
test.describe('US site: in-market RSN (Rangers, ZIP 10001)', () => {
  test('MSG is required; toggling it off drops availability and flips cards to Blacked Out', async ({ page }) => {
    await openTeam(page, `${US_SITE}/new-york-rangers/`);
    const total = await totalGames(page);

    await submitZip(page, '10001');

    // Verdict: in-market, MSG named as the required broadcaster.
    await expect(page.locator('#zipLookupStatus')).toContainText('IN-MARKET');
    await expect(page.locator('#zipLookupStatus')).toContainText('MSG Network');
    await expect(page.locator('#adviceCard')).toContainText('In-Market');
    await expect(page.locator('#adviceCard')).toContainText('MSG Network');
    await expect(sub(page, 'sub_us_rsn')).toBeVisible();
    await expect(sub(page, 'sub_us_rsn')).toContainText('MSG Network');

    // Nothing checked yet: nothing is watchable.
    expect(await watchable(page)).toBe(0);

    // Turn on MSG + ESPN+ (ESPN+ is what gets blacked out in-market).
    await sub(page, 'sub_us_rsn').locator('input').check();
    await sub(page, 'sub_espn_plus').locator('input').check();
    const withRsn = await watchable(page);
    const blackedWithRsn = await blackedOut(page);
    expect(withRsn).toBeGreaterThan(total / 2);

    // MSG row shows as watchable on MSG.
    await expect(page.locator('#scheduleTableBody tr', { hasText: 'Watch on MSG' }).first()).toBeVisible();

    // Toggle MSG OFF.
    await sub(page, 'sub_us_rsn').locator('input').uncheck();

    const withoutRsn = await watchable(page);
    expect(withoutRsn).toBeLessThan(withRsn);
    expect(withRsn - withoutRsn).toBeGreaterThan(total * 0.3); // "significantly"
    expect(await blackedOut(page)).toBeGreaterThan(blackedWithRsn);

    // Game cards: local blackout banner naming the ZIP and the missing RSN.
    const blackedRow = page.locator('#scheduleTableBody tr', { hasText: 'Blacked Out' }).first();
    await expect(blackedRow).toBeVisible();
    await expect(blackedRow).toContainText('BLACKED OUT on ESPN+ in ZIP 10001');
    await expect(blackedRow).toContainText('Requires MSG');
    // Same verdict on the mobile card list.
    await expect(page.locator('#scheduleCardsMobile')).toContainText('BLACKED OUT on ESPN+ in ZIP 10001');
  });
});

// =====================================================================
// 2. US Out-of-Market (ESPN+)
// =====================================================================
test.describe('US site: out-of-market ESPN+ (Rangers, ZIP 90210)', () => {
  test('ESPN+ is the primary broadcaster and gives the best single-subscription availability', async ({ page }) => {
    await openTeam(page, `${US_SITE}/new-york-rangers/`);
    const total = await totalGames(page);

    await submitZip(page, '90210');

    await expect(page.locator('#zipLookupStatus')).toContainText('OUT-OF-MARKET');
    await expect(page.locator('#zipLookupStatus')).toContainText('ESPN+');
    await expect(page.locator('#adviceCard')).toContainText('Out-of-Market');
    await expect(page.locator('#adviceCard')).toContainText('ESPN+');
    // The RSN must NOT be described as required for this ZIP.
    await expect(page.locator('#zipLookupStatus')).not.toContainText('require MSG');

    expect(await watchable(page)).toBe(0);

    // Measure every single-subscription option; ESPN+ must be the winner.
    const ids = ['sub_us_rsn', 'sub_espn_plus', 'sub_espn_abc', 'sub_tnt_max', 'sub_nhl_network'];
    const single = {};
    for (const id of ids) {
      const cb = sub(page, id).locator('input');
      await cb.check();
      single[id] = await watchable(page);
      await cb.uncheck();
    }
    for (const id of ids.filter(i => i !== 'sub_espn_plus')) {
      expect(single.sub_espn_plus, `ESPN+ (${single.sub_espn_plus}) should beat ${id} (${single[id]})`)
        .toBeGreaterThan(single[id]);
    }
    expect(single.sub_espn_plus).toBeGreaterThan(total / 2);

    // With ESPN+ on, regional games are watchable on ESPN+ (not blacked out).
    await sub(page, 'sub_espn_plus').locator('input').check();
    await expect(page.locator('#scheduleTableBody tr', { hasText: 'Watch on ESPN+ (Out-of-Market Stream)' }).first()).toBeVisible();

    // Stacking every broadcaster can only add games, never exceed the total.
    const espnOnly = await watchable(page);
    for (const id of ['sub_espn_abc', 'sub_tnt_max', 'sub_nhl_network']) {
      await sub(page, id).locator('input').check();
    }
    const everything = await watchable(page);
    expect(everything).toBeGreaterThan(espnOnly);
    expect(everything).toBeLessThanOrEqual(total);
  });

  test('ZIP in-market vs out-of-market gives different required broadcaster for the same team', async ({ page }) => {
    await openTeam(page, `${US_SITE}/new-york-rangers/`);
    await submitZip(page, '10001');
    await expect(page.locator('#zipLookupStatus')).toContainText('IN-MARKET');
    await submitZip(page, '90210');
    await expect(page.locator('#zipLookupStatus')).toContainText('OUT-OF-MARKET');
  });
});

// =====================================================================
// 3. Canadian regional (dropdown)
// =====================================================================
test.describe('CA site: regional dropdown (Oilers, Alberta)', () => {
  test('Sportsnet West is the regional broadcaster; toggling it off drops the count', async ({ page }) => {
    await openTeam(page, '/edmonton/');
    const total = await totalGames(page);

    // Alberta is the page default, so move away first to prove the dropdown drives the UI.
    await page.locator('#regionSelect').selectOption({ label: 'Ontario West (Toronto, London, Niagara)' });
    await expect(page.locator('#adviceCard')).toContainText('Out-of-Market');

    await page.locator('#regionSelect').selectOption({ label: 'Alberta' });
    await expect(page.locator('#regionSelect')).toHaveValue('ab');
    await expect(page.locator('#adviceCard')).toContainText('In-Market');

    const west = sub(page, 'sub_regional_en');
    await expect(west).toBeVisible();
    await expect(west).toContainText('Sportsnet West');
    await expect(west.locator('input')).toBeEnabled();

    // Rows show Sportsnet West as the regional requirement.
    await expect(page.locator('#scheduleTableBody tr', { hasText: 'Requires Sportsnet West' }).first()).toBeVisible();

    expect(await watchable(page)).toBe(0);

    await west.locator('input').check();
    const on = await watchable(page);
    expect(on).toBeGreaterThan(0);
    expect(on).toBeLessThan(total);
    await expect(page.locator('#scheduleTableBody tr', { hasText: 'Sportsnet West' }).first()).toBeVisible();

    await west.locator('input').uncheck();
    expect(await watchable(page)).toBe(0);
    await expect(page.locator('#scheduleTableBody tr', { hasText: 'Requires Sportsnet West' }).first()).toBeVisible();
  });
});

// =====================================================================
// 4. Cross-border (US team on CA site)
// =====================================================================
test.describe('CA site: cross-border (Bruins)', () => {
  test('US team is out-of-market in Canada and Sportsnet+ Premium unlocks it', async ({ page }) => {
    await openTeam(page, '/boston-bruins/');
    const total = await totalGames(page);

    await page.locator('#regionSelect').selectOption({ label: 'Ontario West (Toronto, London, Niagara)' });

    const advice = page.locator('#adviceCard');
    await expect(advice).toContainText('Out-of-Market');
    await expect(advice).toContainText('Sportsnet+ Premium');

    // No in-market regional channel exists for a US team.
    await expect(page.locator('#subsList')).not.toContainText('Sportsnet West');
    await expect(sub(page, 'sub_sn_prem')).toBeVisible();

    expect(await watchable(page)).toBe(0);
    const blackedBefore = await blackedOut(page);

    await sub(page, 'sub_sn_prem').locator('input').check();
    const withPremium = await watchable(page);
    expect(withPremium).toBeGreaterThan(total * 0.8);
    expect(await blackedOut(page)).toBeLessThan(blackedBefore);

    // Same conclusion in a different province.
    await page.locator('#regionSelect').selectOption({ label: 'Alberta' });
    await expect(advice).toContainText('Sportsnet+ Premium');
    await expect(advice).toContainText('Out-of-Market');
  });
});

// =====================================================================
// 5. US Local RSN channel filter & 2026-27 network alignment
// =====================================================================
test.describe('US site: 2026-27 RSN labels and Local RSN channel filter', () => {
  test('Seattle Kraken lists Prime Video in Local RSN and filters regional games cleanly', async ({ page }) => {
    await openTeam(page, `${US_SITE}/seattle-kraken/`);
    await expect(sub(page, 'sub_us_rsn')).toContainText('Prime Video');

    await page.locator('#channelFilter').selectOption('LOCAL_RSN');
    const filteredRows = await page.locator('#scheduleTableBody tr').count();
    expect(filteredRows).toBeGreaterThan(5);
    await expect(page.locator('#scheduleTableBody')).toContainText('Prime Video');
  });

  test('Detroit Red Wings uses Detroit SportsNet (DSN) and filters DSN rows cleanly', async ({ page }) => {
    await openTeam(page, `${US_SITE}/detroit-red-wings/`);
    await expect(sub(page, 'sub_us_rsn')).toContainText('Detroit SportsNet (DSN)');
    await expect(sub(page, 'sub_us_rsn')).not.toContainText('FanDuel');

    await page.locator('#channelFilter').selectOption('LOCAL_RSN');
    const filteredRows = await page.locator('#scheduleTableBody tr').count();
    expect(filteredRows).toBeGreaterThan(5);
  });
});
