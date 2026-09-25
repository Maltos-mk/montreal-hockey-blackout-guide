const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8000/teams/montreal/index.html');
  await page.waitForSelector('#scheduleCardsMobile');
  
  const snCheckbox = page.locator('#sub_sn');
  if (!(await snCheckbox.isChecked())) {
    await snCheckbox.check();
  }
  
  await page.click('#status_watchable');
  
  const watchableCards = await page.locator('#scheduleCardsMobile > div').count();
  console.log('Watchable cards:', watchableCards);
  
  await browser.close();
})();
