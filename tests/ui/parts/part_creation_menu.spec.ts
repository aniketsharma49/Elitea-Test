/**
 * Playwright Automation Script: Part Creation Menu Access
 * 
 * Smoke Test — Scenario 1 (Selected for smoke testing):
 *   Entity: Accessing the Part Creation Menu
 *   Precondition: User is logged in with "create" permission for the Part group.
 *
 * Covers:
 *   - Positive: "Add Parts" dropdown is visible and contains correct menu items.
 *   - Negative: Verifies menu items "Create Part" and "Import from File" are present in dropdown.
 *
 * Framework: Playwright (TypeScript)
 * Target URL: https://demo.inventree.org
 */

import { test, expect } from '@playwright/test';

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_URL = 'https://demo.inventree.org';
const USERNAME  = 'engineer';
const PASSWORD  = 'partsonly';
const PARTS_URL = `${BASE_URL}/web/part/category/index/parts`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function login(page: any) {
  await page.goto(`${BASE_URL}/web/`);
  const loggedIn = await page
    .getByRole('tab', { name: 'Parts' })
    .isVisible()
    .catch(() => false);

  if (!loggedIn) {
    await page.getByLabel(/username/i).fill(USERNAME);
    await page.getByLabel(/password/i).fill(PASSWORD);
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(`${BASE_URL}/web/**`, { timeout: 15_000 });
  }
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe('Part Creation Menu — Access & Visibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto(PARTS_URL, { waitUntil: 'networkidle' });
  });

  test('TC-MENU-01 | "Add Parts" dropdown is visible for authorised user', async ({ page }) => {
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await expect(addPartsBtn).toBeVisible({ timeout: 10_000 });
    await expect(addPartsBtn).toBeEnabled();
  });

  test('TC-MENU-02 | "Add Parts" dropdown contains "Create Part" and "Import from File"', async ({ page }) => {
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await addPartsBtn.click();

    const createPartItem = page.getByRole('menuitem', { name: /create part/i });
    await expect(createPartItem).toBeVisible({ timeout: 5_000 });

    const importFileItem = page.getByRole('menuitem', { name: /import from file/i });
    await expect(importFileItem).toBeVisible({ timeout: 5_000 });
  });

  test('TC-MENU-03 | Clicking "Create Part" opens the "Add Part" modal dialog', async ({ page }) => {
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await addPartsBtn.click();

    const createPartItem = page.getByRole('menuitem', { name: /create part/i });
    await createPartItem.click();

    const dialog = page.getByRole('dialog', { name: /add part/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByRole('heading', { name: /add part/i })).toBeVisible();

    await dialog.getByRole('button', { name: /cancel/i }).click();
    await expect(dialog).toBeHidden({ timeout: 5_000 });
  });
});
 * Test Suite: Accessing the Part Creation Menu
 * Scenario: Sub-Page/Component 1 — Creating a Part
 * Entity/Objective: Accessing the Part Creation Menu
 *
 * Covers:
 *  - Scenario 1 (Positive): Verify "Add Parts" dropdown is visible and contains the correct options
 *    for a user WITH create permission.
 *  - Scenario 2 (Negative): Verify "Add Parts" dropdown is NOT visible for a user WITHOUT
 *    create permission (read-only user).
 *
 * Base URL  : https://demo.inventree.org
 * Auth      : engineer / partsonly  (has create permission)
 *             allaccess / nolimits  (admin — used as reference)
 *             reader    / readonly  (no create permission)
 */

import { test, expect, Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helper: log in programmatically via the UI login form
// ---------------------------------------------------------------------------
async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto('https://demo.inventree.org/web/');
  // Wait for either the login page or the already-logged-in redirect
  await page.waitForLoadState('networkidle');

  // If already on /web/logged-in or /web/home we may be auto-logged in; sign out first
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    // Navigate directly to logout endpoint then back to login
    await page.goto('https://demo.inventree.org/api/auth/logout/', { waitUntil: 'commit' });
    await page.goto('https://demo.inventree.org/web/login');
    await page.waitForLoadState('networkidle');
  }

  // Fill credentials
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  // Wait for navigation after login
  await page.waitForURL(/\/(web\/)?(home|part|stock|manufacturing|logged-in)/, { timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// Helper: navigate to the root Parts page
// ---------------------------------------------------------------------------
async function goToParts(page: Page): Promise<void> {
  await page.goto('https://demo.inventree.org/web/part/');
  await page.waitForLoadState('networkidle');
  // Wait until the Parts tab-panel is visible
  await page.waitForSelector('[aria-label="Parts"]', { timeout: 15_000 });
}

// ===========================================================================
// SCENARIO 1 (Positive): User WITH create permission sees "Add Parts" menu
// ===========================================================================
test.describe('Part Creation Menu — Positive (engineer user)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'engineer', 'partsonly');
    await goToParts(page);
  });

  test('TC-MENU-01: "Add Parts" button is visible on the Parts page', async ({ page }) => {
    // The button uses aria-label / name attribute "action-menu-add-parts"
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await expect(addPartsBtn).toBeVisible({ timeout: 10_000 });
  });

  test('TC-MENU-02: "Add Parts" dropdown contains "Create Part" option', async ({ page }) => {
    // Open the dropdown
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await addPartsBtn.click();

    // Verify "Create Part" menu item
    const createPartItem = page.getByRole('menuitem', {
      name: /action-menu-add-parts-create-part/i,
    });
    await expect(createPartItem).toBeVisible({ timeout: 5_000 });
    await expect(createPartItem).toContainText('Create Part');
  });

  test('TC-MENU-03: "Add Parts" dropdown contains "Import from File" option', async ({ page }) => {
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await addPartsBtn.click();

    const importFileItem = page.getByRole('menuitem', {
      name: /action-menu-add-parts-import-from-file/i,
    });
    await expect(importFileItem).toBeVisible({ timeout: 5_000 });
    await expect(importFileItem).toContainText('Import from File');
  });

  test('TC-MENU-04: Clicking "Create Part" opens the "Add Part" modal dialog', async ({ page }) => {
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await addPartsBtn.click();

    const createPartItem = page.getByRole('menuitem', {
      name: /action-menu-add-parts-create-part/i,
    });
    await createPartItem.click();

    // The modal should appear with heading "Add Part"
    const dialog = page.getByRole('dialog', { name: 'Add Part' });
    await expect(dialog).toBeVisible({ timeout: 8_000 });
    await expect(dialog.getByRole('heading', { name: 'Add Part' })).toBeVisible();
  });
});

// ===========================================================================
// SCENARIO 2 (Negative): User WITHOUT create permission does NOT see "Add Parts"
// ===========================================================================
test.describe('Part Creation Menu — Negative (reader user)', () => {
  test.beforeEach(async ({ page }) => {
    // "reader" account has read-only access; no part create permission
    await loginAs(page, 'reader', 'readonly');
    await goToParts(page);
  });

  test('TC-MENU-05: "Add Parts" button is NOT visible for read-only user', async ({ page }) => {
    // The button should not exist or not be visible
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    // Allow a short timeout so the page fully loads before asserting absence
    await expect(addPartsBtn).not.toBeVisible({ timeout: 8_000 });
  });
});
