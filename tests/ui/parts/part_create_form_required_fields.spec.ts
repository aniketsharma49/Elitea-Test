/**
 * Test Suite: Create Part Form — Required Fields Validation
 * Scenario: Sub-Page/Component 1 — Creating a Part
 * Entity/Objective: Create Part Form — Required Fields
 *
 * Covers:
 *  - Scenario 1 (Positive): Fill Name + Description + Category → Submit → redirected to
 *    new part detail page showing the created part.
 *  - Scenario 2 (Negative): Leave Name blank → Submit → inline validation error shown.
 *  - Scenario 3 (Edge Case): Submit a duplicate part name → Verify outcome (allowed or
 *    appropriate validation error).
 *
 * Base URL  : https://demo.inventree.org
 * Auth      : engineer / partsonly
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://demo.inventree.org';
const USERNAME = 'engineer';
const PASSWORD = 'partsonly';

// Unique suffix so each test run creates a truly unique part name
const UNIQUE_SUFFIX = Date.now();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto(`${BASE_URL}/web/`);
  await page.waitForLoadState('networkidle');

  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto(`${BASE_URL}/api/auth/logout/`, { waitUntil: 'commit' });
    await page.goto(`${BASE_URL}/web/login`);
    await page.waitForLoadState('networkidle');
  }

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL(/\/(web\/)?(home|part|stock|manufacturing|logged-in)/, {
    timeout: 15_000,
  });
}

async function openCreatePartDialog(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/web/part/`);
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[aria-label="Parts"]', { timeout: 15_000 });

  // Open "Add Parts" menu
  await page.getByRole('button', { name: 'action-menu-add-parts' }).click();
  // Click "Create Part"
  await page
    .getByRole('menuitem', { name: /action-menu-add-parts-create-part/i })
    .click();

  // Wait for dialog
  await page.waitForSelector('[role="dialog"]', { timeout: 8_000 });
}

/** Fill the Category field via the combobox search */
async function fillCategory(page: Page, categoryName: string): Promise<void> {
  const dialog = page.getByRole('dialog', { name: 'Add Part' });
  const categoryCombo = dialog.getByRole('combobox', { name: 'related-field-category' });
  await categoryCombo.fill(categoryName);
  // Wait for dropdown option and select first result
  const option = page.locator('[class*="option"]').filter({ hasText: new RegExp(categoryName, 'i') }).first();
  await option.waitFor({ timeout: 8_000 });
  await option.click();
}

// ===========================================================================
// SCENARIO 1 (Positive): Successfully create a part with required fields
// ===========================================================================
test.describe('Create Part Form — Positive scenario', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERNAME, PASSWORD);
    await openCreatePartDialog(page);
  });

  test('TC-FORM-01: Create part with Name, Description, and Category → redirects to part detail', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });
    const uniquePartName = `AutoTest-Part-${UNIQUE_SUFFIX}`;

    // Fill Name (required)
    await dialog
      .getByRole('textbox', { name: 'text-field-name' })
      .fill(uniquePartName);

    // Fill Description (optional but tested)
    await dialog
      .getByRole('textbox', { name: 'text-field-description' })
      .fill('Automated Playwright test part');

    // Fill Category
    await fillCategory(page, 'Electronics');

    // Submit the form
    await dialog.getByRole('button', { name: 'Submit' }).click();

    // After successful creation the dialog closes and we are redirected to
    // the new part's detail page.  The URL should contain /web/part/<id>/
    await page.waitForURL(/\/web\/part\/\d+\//, { timeout: 15_000 });

    // Verify the part name appears on the detail page
    await expect(page.getByText(uniquePartName)).toBeVisible({ timeout: 10_000 });
  });
});

// ===========================================================================
// SCENARIO 2 (Negative): Leave Name blank — expect validation error
// ===========================================================================
test.describe('Create Part Form — Negative scenario (blank Name)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERNAME, PASSWORD);
    await openCreatePartDialog(page);
  });

  test('TC-FORM-02: Submitting with blank Name field shows a validation error', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });

    // Leave Name empty, fill description to ensure it's not a general error
    await dialog
      .getByRole('textbox', { name: 'text-field-description' })
      .fill('Desc without name');

    // Attempt to submit
    await dialog.getByRole('button', { name: 'Submit' }).click();

    // Dialog should STILL be open (form was not submitted successfully)
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // Expect an inline error message near the Name field.
    // InvenTree renders field errors as text adjacent to the field.
    const nameFieldArea = dialog.locator('[id*="name"], [aria-label*="name"], [data-field="name"]').first();
    // Fallback: look for common error text patterns anywhere in the dialog
    const errorMessage = dialog.locator('text=/required|This field|enter a value/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 8_000 });
  });
});

// ===========================================================================
// SCENARIO 3 (Edge Case): Duplicate part name
// ===========================================================================
test.describe('Create Part Form — Edge Case (duplicate name)', () => {
  // We use an existing known part name visible in the demo data
  const EXISTING_PART_NAME = '1551ABK';

  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERNAME, PASSWORD);
    await openCreatePartDialog(page);
  });

  test('TC-FORM-03: Submitting a duplicate part name is either accepted or shows a validation error', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });

    await dialog
      .getByRole('textbox', { name: 'text-field-name' })
      .fill(EXISTING_PART_NAME);
    await dialog
      .getByRole('textbox', { name: 'text-field-description' })
      .fill('Duplicate name test');

    await dialog.getByRole('button', { name: 'Submit' }).click();

    // Two acceptable outcomes:
    // a) Duplicate names are allowed → redirected to new part detail page
    // b) Duplicate names are rejected → dialog stays open with an error
    const isRedirected = await page
      .waitForURL(/\/web\/part\/\d+\//, { timeout: 8_000 })
      .then(() => true)
      .catch(() => false);

    if (isRedirected) {
      // Names are globally non-unique; part was created successfully
      console.log(
        'TC-FORM-03: Duplicate names are allowed — new part created at:',
        page.url()
      );
      await expect(page.getByText(EXISTING_PART_NAME)).toBeVisible({ timeout: 8_000 });
    } else {
      // Dialog still visible — expect a validation / server error message
      await expect(dialog).toBeVisible({ timeout: 5_000 });
      const errorMsg = dialog
        .locator('text=/already exists|duplicate|unique/i')
        .first();
      await expect(errorMsg).toBeVisible({ timeout: 8_000 });
      console.log('TC-FORM-03: Duplicate name rejected with validation error.');
    }
  });
});
