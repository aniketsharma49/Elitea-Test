/**
 * Playwright Configuration for InvenTree Parts UI Tests
 * Path: tests/ui/parts/playwright.config.ts
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory (relative to this config file)
  testDir: '.',

  // Run files in parallel
  fullyParallel: false, // Sequential to avoid login/state conflicts on the demo server

  // Fail the build on CI if test.only is accidentally left in the code
  forbidOnly: !!process.env.CI,

  // Retry failed tests once on CI
  retries: process.env.CI ? 1 : 0,

  // Number of workers (1 to avoid race conditions on shared demo server)
  workers: 1,

  // Reporter
  reporter: [
    ['html', { outputFolder: '../../../test-results/html-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: '../../../test-results/results.json' }],
  ],

  // Global settings
  use: {
    baseURL: 'https://demo.inventree.org',
    // Record traces for failures
    trace: 'on-first-retry',
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on retry
    video: 'on-first-retry',
    // Generous timeout for the demo server
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Test timeout
  timeout: 60_000,

  // Projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  // Output directory for test artifacts
  outputDir: '../../../test-results/artifacts',
});
