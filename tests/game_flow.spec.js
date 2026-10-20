const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  page.on('pageerror', exception => {
    throw new Error(`[BROWSER UNCAUGHT EXCEPTION] ${exception.message}`);
  });
});

test('User flow: Toronto -> Alberta + SN+ Premium -> Buffalo game page', async ({ page }) => {
  await page.goto('/toronto/');
  
  // Select Alberta
  await page.selectOption('#regionSelect', 'ab');
  
  // Check SN+ Premium
  const prem = page.locator('#sub_sn_prem');
  if (!(await prem.isChecked())) {
    await prem.check();
  }
  
  // Verify localStorage on Toronto
  const torontoRegion = await page.evaluate(() => localStorage.getItem('hockeyblackouts_region'));
  expect(torontoRegion).toBe('ab');
  
  // Click the first upcoming Regional Territory game link in the desktop schedule table
  const regionalGameLink = page.locator('#scheduleTableBody tr', { hasText: 'Regional Territory' }).locator('a[href*="/game/"]').first();
  await expect(regionalGameLink).toBeVisible();
  await regionalGameLink.click();
  
  // Wait for game page to load
  await page.waitForURL(/.*\/game\/.*/);
  
  // Verify active pill on game page is Alberta
  const activePill = page.locator('.region-pill.bg-\\[\\#AF1E2D\\]');
  await expect(activePill).toHaveAttribute('data-region', 'ab');
  await expect(activePill).toContainText('Alberta');
  
  // Verify active region label
  const regionLabel = page.locator('#activeRegionLabel');
  await expect(regionLabel).toContainText('Alberta');
  
  // Verify unlocked note for Sportsnet+ Premium
  const explanation = page.locator('#verdictExplanation');
  await expect(explanation).toContainText('Sportsnet+ Premium');
  
  // Test clicking BC / Yukon pill
  const bcPill = page.locator('.region-pill[data-region="bc"]');
  await bcPill.click();
  
  const bcActive = page.locator('.region-pill.bg-\\[\\#AF1E2D\\]');
  await expect(bcActive).toHaveAttribute('data-region', 'bc');
  
  const storedRegion = await page.evaluate(() => localStorage.getItem('hockeyblackouts_region'));
  expect(storedRegion).toBe('bc');
});

test('Mobile user flow: Toronto mobile card -> game page carries state', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/toronto/');
  
  // Select Manitoba
  await page.selectOption('#regionSelect', 'mb');
  
  // Check Prime Video
  const primeCb = page.locator('#sub_prime');
  if (!(await primeCb.isChecked())) {
    await primeCb.check();
  }
  
  // Find visible mobile card link
  const cardLink = page.locator('#scheduleCardsMobile a[href*="/game/"]').first();
  await expect(cardLink).toBeVisible();
  await cardLink.click();
  
  await page.waitForURL(/.*\/game\/.*/);
  
  // Verify Manitoba is selected
  const activePill = page.locator('.region-pill.bg-\\[\\#AF1E2D\\]');
  await expect(activePill).toHaveAttribute('data-region', 'mb');
  await expect(activePill).toContainText('Manitoba');
});
