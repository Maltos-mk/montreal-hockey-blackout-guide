const { test, expect } = require('@playwright/test');

test.describe('Broadcast Guide UAT', () => {
  
  test('Montreal Canadiens Site', async ({ page }) => {
    await page.goto('http://localhost:8000/teams/montreal/');
    await expect(page).toHaveTitle(/Montreal Hockey Broadcast/);
    
    // Should have TSN2 and RDS
    await expect(page.locator('#sub_regional_en')).toBeVisible();
    await expect(page.locator('#sub_regional_fr')).toBeVisible();
    
    // Check initial state (84 games)
    await expect(page.locator('#totalGameLabel')).toHaveText('/ 84 GAMES');
    
    // Ensure schedule renders
    const gameRows = page.locator('.game-card');
    const count = await gameRows.count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('Toronto Maple Leafs Site', async ({ page }) => {
    await page.goto('http://localhost:8000/teams/toronto/');
    await expect(page).toHaveTitle(/Toronto Hockey Broadcast/);
    
    // Should have TSN4 but NO regional FR (RDS)
    await expect(page.locator('#sub_regional_en')).toBeVisible();
    await expect(page.locator('#sub_regional_fr')).toHaveCount(0);
    
    const count = await page.locator('.game-card').count();
    expect(count).toBeGreaterThan(0);
  });
  
  test('Ottawa Senators Site', async ({ page }) => {
    await page.goto('http://localhost:8000/teams/ottawa/');
    await expect(page).toHaveTitle(/Ottawa Hockey Broadcast/);
    
    // Should have TSN5 and RDS
    await expect(page.locator('#sub_regional_en')).toBeVisible();
    await expect(page.locator('#sub_regional_fr')).toBeVisible();
    
    // Wait for data load
    await page.waitForSelector('.game-card');
    
    // Click regional channel checkbox and see watchable count change
    const initialWatchable = await page.locator('#watchableCount').innerText();
    
    // Uncheck TSN5
    await page.locator('#sub_regional_en').uncheck();
    
    // Watchable count should decrease
    const newWatchable = await page.locator('#watchableCount').innerText();
    expect(parseInt(newWatchable)).toBeLessThan(parseInt(initialWatchable));
  });

});
