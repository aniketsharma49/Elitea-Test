import { test, expect } from '@playwright/test';

// Sample Playwright test for EPAM homepage
// Scenario:
// 1) Navigate to https://www.epam.com/
// 2) Maximize the window (use a large viewport size)
// 3) Verify that the text "epam" is visible on the page

test('EPAM homepage: should display "epam" text', async ({ page }) => {
  // Maximize the window by setting a large viewport size.
  // (True OS-level maximize requires headed mode launch args; this is the common CI-friendly approach.)
  await page.setViewportSize({ width: 1920, height: 1080 });

  // Navigate to EPAM homepage
  await page.goto('https://www.epam.com/', { waitUntil: 'domcontentloaded' });

  // Validate that the page contains the text "epam" (case-insensitive)
  await expect(page.getByText(/epam/i).first()).toBeVisible();
});
