/**
 * Playwright Automation Script: Create Part Form — Required Fields
 *
 * Scenario 2 — Create Part Form Required Fields:
 *   Entity: Create Part Form — Required Fields
 *   Precondition: User is logged in with part "create" permission.
 *                 The "Create Part" form is open.
 *
 * Covers:
 *   - Positive: Fill Name + Description + Category → Submit → Redirected to part detail page.
 *   - Negative: Leave Name blank → Submit → Inline validation error displayed.
 *
 * Framework: Playwright (TypeScript)
 * Target URL: https://demo.inventree.org
 */

import { test, expect } from '@playwright/test';

// ─── Constants ───────────────────────────────────────────────────────────────
const BASE_URL  = 'https://demo.inventree.org';
const USERNAME  = 'engineer';
const PASSWORD  = 'partsonly';
const PARTS_URL = `${BASE_URL}/web/part/category/index/parts`;

// Unique suffix to avoid duplicate-name conflicts on the shared demo server
const UNIQUE_SUFFIX = Date.now();
const TEST_PART_NAME = `Playwright-Test-Part-${UNIQUE_SUFFIX}`;
const TEST_DESCRIPTION = 'Auto-generated part by Playwright UI test';

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

async function openCreatePartDialog(page: any) {
  await page.goto(PARTS_URL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'action-menu-add-parts' }).click();
  await page.getByRole('menuitem', { name: /create part/i }).click();
  await page.getByRole('dialog', { name: /add part/i }).waitFor({ state: 'visible', timeout: 10_000 });
}

// ─── Tests ───────────────────────────────────────────────────────────────────
test.describe('Create Part Form — Required Fields Validation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Positive: Valid name + description → part created, redirect occurs ───
  test('TC-FORM-01 | Valid part name and description creates the part successfully', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    // Fill in the Name field (required)
    await dialog.getByRole('textbox', { name: /text-field-name/i }).fill(TEST_PART_NAME);

    // Fill in the Description field (optional but tested)
    await dialog.getByRole('textbox', { name: /text-field-description/i }).fill(TEST_DESCRIPTION);

    // Click Submit
    await dialog.getByRole('button', { name: /submit/i }).click();

    // After successful creation the dialog closes and the browser navigates to the new part's detail page
    // URL pattern: /web/part/<id>/detail or similar
    await expect(page).toHaveURL(/\/web\/part\/\d+/, { timeout: 15_000 });

    // The part detail page should display the part name we just created
    await expect(page.getByText(TEST_PART_NAME)).toBeVisible({ timeout: 10_000 });
  });

  // ── Negative: Submit with blank Name → validation error shown ───────────
  test('TC-FORM-02 | Submitting with blank Name field shows required-field error', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    // Leave Name field intentionally blank
    const nameField = dialog.getByRole('textbox', { name: /text-field-name/i });
    await nameField.clear();

    // Click Submit
    await dialog.getByRole('button', { name: /submit/i }).click();

    // The dialog should remain open (form NOT submitted)
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // An inline validation error message should appear near the Name field
    // InvenTree renders validation text as a visible error / required indicator
    const nameFieldWrapper = page.locator('[id*="name"], [aria-label*="name"], .form-field').filter({ hasText: /name/i }).first();
    // Acceptable error indicators: "required", "This field is required", asterisk with validation, etc.
    // We check that an error-class element or "required" text is visible inside the form
    const errorLocator = dialog.locator('text=/required|this field|must not be blank/i');
    await expect(errorLocator.first()).toBeVisible({ timeout: 5_000 });
  });

  // ── Positive: Verify all key form fields are present when dialog opens ───
  test('TC-FORM-03 | "Add Part" dialog contains all expected form fields', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    // Name (required)
    await expect(dialog.getByRole('textbox', { name: /text-field-name/i })).toBeVisible();

    // Description
    await expect(dialog.getByRole('textbox', { name: /text-field-description/i })).toBeVisible();

    // IPN
    await expect(dialog.getByRole('textbox', { name: /text-field-IPN/i })).toBeVisible();

    // Submit & Cancel buttons
    await expect(dialog.getByRole('button', { name: /submit/i })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /cancel/i })).toBeVisible();

    // Boolean toggles (assembly, component, active, purchaseable)
    await expect(dialog.getByRole('switch', { name: /boolean-field-active/i })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: /boolean-field-assembly/i })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: /boolean-field-component/i })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: /boolean-field-purchaseable/i })).toBeVisible();

    // Dismiss
    await dialog.getByRole('button', { name: /cancel/i }).click();
  });
});
