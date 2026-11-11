const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8099',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      // Canadian site (hockeyblackouts.ca)
      command: 'python3 -m http.server 8099 --directory build',
      url: 'http://localhost:8099',
      reuseExistingServer: true,
    },
    {
      // US site (hockeyblackouts.com), served from its own root like production
      command: 'python3 -m http.server 8100 --directory build_com',
      url: 'http://localhost:8100',
      reuseExistingServer: true,
    },
  ],
});
