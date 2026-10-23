const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  // Prevent tests from sending real telemetry to live Umami servers
  await page.route('**/*umami*', route => route.abort());
  page.on('pageerror', exception => {
    throw new Error(`[BROWSER UNCAUGHT EXCEPTION] ${exception.message}`);
  });
});

test('Toronto: Checking streamers updates watchable score without errors', async ({ page }) => {
  await page.goto('/toronto/');
  await page.waitForSelector('#scheduleTableBody');

  await expect(page).toHaveTitle(/Toronto Maple Leafs/);
  // Toronto has TSN4 (regional EN) but NO regional FR (RDS)
  await expect(page.locator('#sub_regional_en')).toBeVisible();
  await expect(page.locator('#sub_regional_fr')).toHaveCount(0);
  await expect(page.locator('#totalGameLabel')).toHaveText('/ 84 GAMES');

  const countEl = page.locator('#watchableCount');

  // Initial count with no subs checked is 0
  const initialText = await countEl.textContent();
  const initialCount = parseInt(initialText.trim(), 10);
  expect(initialCount).toBe(0);

  // Toggle Prime Video -> count must increase
  const prime = page.locator('#sub_prime');
  await prime.check();
  const primeText = await countEl.textContent();
  const primeCount = parseInt(primeText.trim(), 10);
  expect(primeCount).toBeGreaterThan(0);

  // Toggle Sportsnet+ Premium -> in-market gives 58 Sportsnet games (55 national + 3 Sportsnet Ontario regional)
  const snPrem = page.locator('#sub_sn_prem');
  await snPrem.check();
  const premText = await countEl.textContent();
  expect(parseInt(premText.trim(), 10)).toBe(58);

  // Toggle Regional Sports Package (TSN4 in Ontario) -> reaches 84
  const regionalEn = page.locator('#sub_regional_en');
  await regionalEn.check();
  const fullText = await countEl.textContent();
  expect(fullText.trim()).toBe('84');

  // Uncheck Regional Sports Package -> drops back to 58
  await regionalEn.uncheck();
  const afterUncheckText = await countEl.textContent();
  expect(afterUncheckText.trim()).toBe('58');
});

test('Montreal: Regional channels (TSN2, RDS) and status filtering', async ({ page }) => {
  await page.goto('/montreal/');
  await page.waitForSelector('#scheduleTableBody');

  await expect(page).toHaveTitle(/Montreal Canadiens/);
  // Montreal has TSN2 (regional EN) and RDS (regional FR)
  await expect(page.locator('#sub_regional_en')).toBeVisible();
  await expect(page.locator('#sub_regional_fr')).toBeVisible();
  await expect(page.locator('#totalGameLabel')).toHaveText('/ 84 GAMES');

  // Verify Sportsnet is checked by default or check it
  const snCheckbox = page.locator('#sub_sn_cable');
  if (await snCheckbox.isVisible() && !(await snCheckbox.isChecked())) {
    await snCheckbox.check();
  }

  // Switch to Watchable filter
  await page.selectOption('#statusFilter', 'watchable');
  const watchableCards = await page.locator('#scheduleTableBody > tr').count();
  expect(watchableCards).toBeGreaterThan(0);

  // Switch to All filter
  await page.selectOption('#statusFilter', 'all');
  const allCards = await page.locator('#scheduleTableBody > tr').count();
  expect(allCards).toBeGreaterThan(watchableCards);
});

test('Ottawa: Regional feeds (TSN5, RDS) and watchable score updates', async ({ page }) => {
  await page.goto('/ottawa/');
  await page.waitForSelector('#scheduleTableBody');

  await expect(page).toHaveTitle(/Ottawa Senators/);
  // Ottawa has TSN5 (regional EN) and RDS (regional FR)
  await expect(page.locator('#sub_regional_en')).toBeVisible();
  await expect(page.locator('#sub_regional_fr')).toBeVisible();
  await expect(page.locator('#totalGameLabel')).toHaveText('/ 84 GAMES');

  const countEl = page.locator('#watchableCount');
  const initialCount = parseInt((await countEl.textContent()).trim(), 10);

  // Toggle TSN5 and verify watchable score adjusts reactively
  const tsn5 = page.locator('#sub_regional_en');
  if (await tsn5.isChecked()) {
    await tsn5.uncheck();
    const updatedCount = parseInt((await countEl.textContent()).trim(), 10);
    expect(updatedCount).toBeLessThan(initialCount);
    await tsn5.check();
    expect(parseInt((await countEl.textContent()).trim(), 10)).toBe(initialCount);
  } else {
    await tsn5.check();
    const updatedCount = parseInt((await countEl.textContent()).trim(), 10);
    expect(updatedCount).toBeGreaterThan(initialCount);
    await tsn5.uncheck();
    expect(parseInt((await countEl.textContent()).trim(), 10)).toBe(initialCount);
  }
});

test('Subscriptions persistence: clean URL on default load for SEO, updates hash on user selection, and survives page reload', async ({ page }) => {
  await page.goto('/toronto/');
  await page.waitForSelector('#scheduleTableBody');

  // On initial default load, URL hash must remain completely empty so crawlers see clean canonical URL
  expect(await page.evaluate(() => window.location.hash)).toBe('');

  // Check Prime Video and Sportsnet+ Premium
  await page.locator('#sub_prime').check();
  await page.locator('#sub_sn_prem').check();
  expect(await page.locator('#sub_prime').isChecked()).toBe(true);
  expect(await page.locator('#sub_sn_prem').isChecked()).toBe(true);

  // Hash must now reflect user selections for sharing/bookmarking
  const activeHash = await page.evaluate(() => window.location.hash);
  expect(activeHash).toContain('prime=true');
  expect(activeHash).toContain('sn_prem=true');

  // Reload the page
  await page.reload();
  await page.waitForSelector('#scheduleTableBody');

  // Verify selections are remembered
  expect(await page.locator('#sub_prime').isChecked()).toBe(true);
  expect(await page.locator('#sub_sn_prem').isChecked()).toBe(true);
  const count = await page.locator('#watchableCount').textContent();
  expect(parseInt(count.trim(), 10)).toBe(58);
});

test('Edmonton: Sportsnet+ Premium + Prime yields 84/84 in Alberta and auto-includes Standard', async ({ page }) => {
  await page.goto('/edmonton/');
  await page.waitForSelector('#scheduleTableBody');

  const countEl = page.locator('#watchableCount');
  const snPlus = page.locator('#sub_sn_plus');
  const snPrem = page.locator('#sub_sn_prem');
  const prime = page.locator('#sub_prime');
  const centreIce = page.locator('#sub_centre_ice');

  // Check Prime and Sportsnet+ Premium
  await prime.check();
  await snPrem.check();

  // Sportsnet+ Standard must now be disabled and marked included
  expect(await snPlus.isChecked()).toBe(true);
  expect(await snPlus.isDisabled()).toBe(true);

  // In Alberta, Oilers with SN+ Premium + Prime yields 84/84 games
  const fullCount = await countEl.textContent();
  expect(fullCount.trim()).toBe('84');

  // Unchecking SN+ Premium re-enables Standard
  await snPrem.uncheck();
  expect(await snPlus.isDisabled()).toBe(false);

  // Selecting Centre Ice alone in-market does NOT unlock in-market regional games
  await centreIce.check();
  const centreIceCount = await countEl.textContent();
  expect(parseInt(centreIceCount.trim(), 10)).toBeLessThan(84);
});

test('Ko-fi multivariate testing: assigns variant, persists in localStorage, updates UI copy, and does not misfire Umami events on load', async ({ page }) => {
  await page.addInitScript(() => {
    window.__umamiCalls = [];
    window.umami = {
      track: (name, data) => {
        window.__umamiCalls.push({ name, data });
      }
    };
  });

  await page.goto('/toronto/');
  await page.waitForSelector('#kofiCalloutBox');

  // Verify no automatic kofi-impression or kofi-click events fired on page load
  const loadCalls = await page.evaluate(() => window.__umamiCalls);
  expect(loadCalls).toEqual([]);

  // Verify no duplicate manual click binding is attached to [data-umami-event] elements
  const isManualBound = await page.locator('#kofiCalloutBtn').evaluate(el => el.dataset.umamiBound);
  expect(isManualBound).toBeUndefined();

  // Verify variant was assigned and stored
  const assignedVariant = await page.evaluate(() => localStorage.getItem('hb_kofi_variant'));
  expect(['control', 'anti_gambling', 'telecom_spite', 'swear_jar']).toContain(assignedVariant);

  const btnVariant = await page.locator('#kofiCalloutBtn').getAttribute('data-umami-event-variant');
  expect(btnVariant).toBe(assignedVariant);

  // Test deterministic override for anti-gambling variant
  await page.evaluate(() => localStorage.setItem('hb_kofi_variant', 'anti_gambling'));
  await page.reload();
  await page.waitForSelector('#kofiCalloutBox');

  const btnText = await page.locator('#kofiCalloutBtnText').textContent();
  expect(btnText.trim()).toBe('Buy the Dev a $3 Beer');
  const copyText = await page.locator('#kofiCalloutText').textContent();
  expect(copyText).toContain('Zero gambling ads');

  // Navigate to game page and confirm variant consistency
  await page.goto('/game/2026-10-15/toronto-vs-buffalo/');
  await page.waitForSelector('#gameKofiCard');
  const gameBtnVariant = await page.locator('#gameKofiBtn').getAttribute('data-umami-event-variant');
  expect(gameBtnVariant).toBe('anti_gambling');
  const gameBtnText = await page.locator('#gameKofiBtnText').textContent();
  expect(gameBtnText).toContain('Buy the Dev a $3 Beer');
});

test('French Montreal Hub (/fr/montreal/): renders 100% French UI, schedule, reasons, and Ko-fi variants with zero English leaks', async ({ page }) => {
  await page.goto('/fr/montreal/');
  await page.waitForSelector('#scheduleTableBody');

  expect(await page.locator('html').getAttribute('lang')).toBe('fr');
  expect(await page.locator('#totalGameLabel').textContent()).toContain('MATCHS');
  expect(await page.locator('#pctBadge').textContent()).toContain('disponibles');
  expect(await page.locator('#adviceCard').textContent()).toContain('Tous les matchs dans votre marché');

  // Check RDS and TVA Sports -> verify French watchable badges and reasons
  await page.locator('#sub_regional_fr').check();
  await page.locator('#sub_national_fr').check();
  const watchableCount = parseInt((await page.locator('#watchableCount').textContent()).trim(), 10);
  expect(watchableCount).toBeGreaterThan(50);

  const tableText = await page.locator('#scheduleTableBody').textContent();
  expect(tableText).toContain('Disponible');
  expect(tableText).toContain('À voir sur');
  expect(tableText).not.toContain('Watchable');
  expect(tableText).not.toContain('Need Sub');
  expect(tableText).not.toContain('Requires ');

  // Switch region to Ontario West (out-of-market) -> verify French blackout message and advice card
  await page.selectOption('#regionSelect', 'on_west');
  expect(await page.locator('#adviceCard').textContent()).toContain('Options officielles hors marché');
  const oomTableText = await page.locator('#scheduleTableBody').textContent();
  expect(oomTableText).toContain('Blackout');
  expect(oomTableText).not.toContain('Blacked Out');

  // Verify French Ko-fi variant copy
  await page.evaluate(() => localStorage.setItem('hb_kofi_variant', 'anti_gambling'));
  await page.reload();
  await page.waitForSelector('#kofiCalloutBox');
  expect((await page.locator('#kofiCalloutBtnText').textContent()).trim()).toBe('Payer une bière au dev (3 $)');
});

test('How Blackouts Work: Diagnostic tool awaits user click, updates territory on change, and detects match/mismatch', async ({ page }) => {
  let ipFetchTriggered = false;
  await page.route('https://ipwho.is/**', async (route) => {
    ipFetchTriggered = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        ip: '198.51.100.1',
        city: 'Toronto',
        region: 'Ontario',
        region_code: 'ON',
        connection: { isp: 'Rogers Cable' }
      })
    });
  });

  await page.goto('/how-blackouts-work/');
  await page.waitForSelector('#blackout-triage');

  // Verify that connection is NOT scanned automatically on load
  expect(ipFetchTriggered).toBe(false);
  expect(await page.locator('#connectionBadge').textContent()).toBe('Awaiting Scan');
  expect(await page.locator('#detectedLocation').textContent()).toContain('Click "Scan My Connection"');

  // Changing team dropdown updates right-hand card without scanning
  await page.selectOption('#userTeamSelect', 'TOR');
  expect(await page.locator('#teamMarketText').textContent()).toContain('Ontario (West of Belleville)');
  expect(await page.locator('#diagnosticVerdictBox').textContent()).toContain('Ready to Test Your Geolocation for the Toronto Maple Leafs');
  expect(ipFetchTriggered).toBe(false);

  // User explicitly clicks "Scan My Connection"
  await page.locator('#runIpDiagnosticBtn').click();
  await page.waitForSelector('#diagnosticVerdictBox:has-text("LOCATION MATCH")');

  expect(ipFetchTriggered).toBe(true);
  expect(await page.locator('#connectionBadge').textContent()).toBe('Active IP Verified');
  expect(await page.locator('#detectedLocation').textContent()).toBe('Toronto, Ontario');
  expect(await page.locator('#detectedIsp').textContent()).toBe('Rogers Cable');
  expect(await page.locator('#diagnosticVerdictBox').textContent()).toContain('LOCATION MATCH: Your IP (Toronto, Ontario) is INSIDE the Toronto Maple Leafs Territory');

  // Changing team to Montreal Canadiens immediately flags the mismatch
  await page.selectOption('#userTeamSelect', 'MTL');
  await page.waitForSelector('#diagnosticVerdictBox:has-text("LOCATION MISMATCH")');
  const verdictText = await page.locator('#diagnosticVerdictBox').textContent();
  expect(verdictText).toContain('LOCATION MISMATCH: Your IP (Toronto, Ontario) is OUTSIDE the Montreal Canadiens Territory');
  expect(verdictText).toContain('Sportsnet+ Premium');
});




