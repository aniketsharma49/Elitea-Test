import { test, expect, Page } from '@playwright/test';

/**
 * Attempts to dismiss the cookie consent banner if it appears.
 * The EPAM site can show different variants depending on region/session.
 */
async function dismissCookiesIfPresent(page: Page): Promise<void> {
  // Common cookie banner button labels that may appear.
  const acceptCandidates = [
    /accept all/i,
    /accept cookies/i,
    /^accept$/i,
    /i agree/i,
    /agree and proceed/i,
  ];

  for (const name of acceptCandidates) {
    const btn = page.getByRole('button', { name }).first();
    const visible = await btn.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await btn.click().catch(() => undefined);
      // Give the UI a moment to settle after dismiss.
      await page.waitForTimeout(500);
      return;
    }
  }
}

test.describe('EPAM - Client Work navigation', () => {
  test('Navigate via Services -> Explore Our Client Work and verify Client Work page', async ({ page }) => {
    // 1) Navigate to EPAM homepage.
    await page.goto('https://www.epam.com/', { waitUntil: 'domcontentloaded' });

    // Best-effort: dismiss cookie consent if it blocks the header.
    await dismissCookiesIfPresent(page);

    // 2) Select the "Services" option from the header menu.
    // The site can render it as a link or a menu button depending on viewport.
    const servicesLink = page.getByRole('link', { name: /^services$/i }).first();
    const servicesButton = page.getByRole('button', { name: /^services$/i }).first();

    if (await servicesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await servicesLink.click();
    } else {
      await servicesButton.click();
    }

    // Wait for navigation (either full page navigation or client-side route change).
    await page.waitForLoadState('domcontentloaded');

    // 3) Click the "Explore Our Client Work" link.
    // This CTA exists on the Services section/pages and navigates to Client Work.
    const exploreClientWork = page.getByRole('link', { name: /explore our client work/i }).first();
    await expect(exploreClientWork).toBeVisible({ timeout: 15000 });
    await exploreClientWork.click();

    // 4) Verify that the text "Client Work" is visible on the final page.
    await page.waitForLoadState('domcontentloaded');

    // Prefer a heading assertion, but fall back to any visible text.
    const clientWorkHeading = page.getByRole('heading', { name: /client work/i }).first();
    const clientWorkText = page.getByText(/client work/i).first();

    if (await clientWorkHeading.isVisible({ timeout: 8000 }).catch(() => false)) {
      await expect(clientWorkHeading).toBeVisible();
    } else {
      await expect(clientWorkText).toBeVisible();
    }
  });
});
