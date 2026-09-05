const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 401 tests: 1 worker + 2 retries blew every job's time budget.
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Video is off in CI. With this many failing tests it produced a 512 MB
    // firefox artifact and a 118 MB one for the 32-test accessibility job, and
    // recording costs wall-clock on every test whether or not it is kept. The
    // trace captured on retry already carries screenshots, DOM snapshots,
    // console and network — strictly more than a video shows — so this loses no
    // diagnostic information.
    video: process.env.CI ? 'off' : 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // dev-server.js rather than http-server, because it gzips text responses and
  // http-server does not. Both GitHub Pages and Firebase Hosting serve this site
  // gzipped, so measuring transferSize against an uncompressed server described a
  // transport no visitor uses — the page-weight assertion read 6.87 MB where the
  // real site transfers a fraction of that. It is also the server `npm run dev`
  // uses, so local and CI now exercise the same code path.
  webServer: {
    command: 'node dev-server.js',
    env: { PORT: '8080' },
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
