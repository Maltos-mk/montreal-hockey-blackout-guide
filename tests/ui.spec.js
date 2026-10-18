const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  page.on('pageerror', exception => {
    throw new Error(`[BROWSER UNCAUGHT EXCEPTION] ${exception.message}`);
  });
});

test('Toronto: Checking streamers updates watchable score without errors', async ({ page }) => {
  await page.goto('/toronto/');
  await page.waitForSelector('#scheduleTableBody');

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

  // Toggle Sportsnet+ Premium -> in-market gives 55 Sportsnet games
  const snPrem = page.locator('#sub_sn_prem');
  await snPrem.check();
  const premText = await countEl.textContent();
  expect(parseInt(premText.trim(), 10)).toBe(55);

  // Toggle Regional Sports Package (TSN4 in Ontario) -> reaches 84
  const regionalEn = page.locator('#sub_regional_en');
  await regionalEn.check();
  const fullText = await countEl.textContent();
  expect(fullText.trim()).toBe('84');

  // Uncheck Regional Sports Package -> drops back to 55
  await regionalEn.uncheck();
  const afterUncheckText = await countEl.textContent();
  expect(afterUncheckText.trim()).toBe('55');
});

test('Montreal: Status filtering works correctly', async ({ page }) => {
  await page.goto('/montreal/');
  await page.waitForSelector('#scheduleTableBody');

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

test('Subscriptions persistence: checked channels survive page reload', async ({ page }) => {
  await page.goto('/toronto/');
  await page.waitForSelector('#scheduleTableBody');

  // Check Prime Video and Sportsnet+ Premium
  await page.locator('#sub_prime').check();
  await page.locator('#sub_sn_prem').check();
  expect(await page.locator('#sub_prime').isChecked()).toBe(true);
  expect(await page.locator('#sub_sn_prem').isChecked()).toBe(true);

  // Reload the page
  await page.reload();
  await page.waitForSelector('#scheduleTableBody');

  // Verify selections are remembered
  expect(await page.locator('#sub_prime').isChecked()).toBe(true);
  expect(await page.locator('#sub_sn_prem').isChecked()).toBe(true);
  const count = await page.locator('#watchableCount').textContent();
  expect(parseInt(count.trim(), 10)).toBe(55);
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



