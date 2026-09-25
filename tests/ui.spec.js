const { test, expect } = require('@playwright/test');

test('Montreal: Status filtering works correctly', async ({ page }) => {
  await page.goto('http://localhost:8000/teams/montreal/index.html');
  
  await page.waitForSelector('#scheduleTableBody');

  // Verify Sportsnet is checked by default or check it
  const snCheckbox = page.locator('#sub_sn');
  if (!(await snCheckbox.isChecked())) {
    await snCheckbox.check();
  }

  // Switch to Watchable filter
  await page.click('#status_watchable');
  
  // The bug previously caused this to return 0 games. It should return > 0 now.
  const watchableCards = await page.locator('#scheduleTableBody > tr').count();
  expect(watchableCards).toBeGreaterThan(0);

  // Switch to All filter
  await page.click('#status_all');
  const allCards = await page.locator('#scheduleTableBody > tr').count();
  expect(allCards).toBeGreaterThan(watchableCards);
});

test('Toronto: PWA install modal triggers after 3s on mobile viewport', async ({ page }) => {
  // Emulate a mobile device
  await page.setViewportSize({ width: 375, height: 812 });
  
  await page.goto('http://localhost:8000/teams/toronto/index.html');
  
  // Wait for the 8000ms setTimeout to fire
  await page.waitForTimeout(3500);
  
  const modal = page.locator('#directInstallModal');
  
  // Ensure the modal removes the "hidden" class
  await expect(modal).not.toHaveClass(/hidden/);
  await expect(modal).toBeVisible();
});
