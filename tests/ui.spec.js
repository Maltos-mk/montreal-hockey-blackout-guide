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
