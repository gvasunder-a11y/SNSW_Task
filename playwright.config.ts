import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Live SNSW journeys can be slower than local apps, so each test gets a practical timeout. */
  timeout: 90000,
  outputDir: 'test-results',
  /* Live public services are run serially to avoid flakiness from shared network/browser load. */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Keep execution stable locally and in CI for this interview framework. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['github'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    // baseURL: 'http://localhost:3000',

    /* Playwright captures failure screenshots; UI step screenshots are captured by screenshotHelper. */
    screenshot: 'only-on-failure',
    actionTimeout: 20000,
    navigationTimeout: 30000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'api',
      /* API tests run once and are not repeated under every browser project. */
      testMatch: '**/api/**/*.spec.js',
    },
    {
      name: 'chrome',
      /* Chrome is the primary browser for UI plus automated accessibility scans. */
      testMatch: [
        '**/ui/**/*.spec.js',
        '**/accessibility/**/*.spec.js',
      ],
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
    {
      name: 'firefox',
      /* Firefox runs UI regression coverage; accessibility scans stay in Chrome to reduce noise. */
      testMatch: [
        '**/ui/**/*.spec.js',
      ],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      /* WebKit runs UI regression coverage for Safari-like behavior. */
      testMatch: [
        '**/ui/**/*.spec.js',
      ],
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
