/**
 * Test Suite: Part Creation — End-to-End Smoke Test
 * Scenario: Sub-Page/Component 1 — Creating a Part (Full Workflow)
 *
 * This is the PRIMARY SMOKE TEST selected from the scenarios.
 * It validates the complete journey:
 *   1. Login as engineer
 *   2. Navigate to Parts page
 *   3. Verify "Add Parts" dropdown is present with all expected menu items
 *   4. Open "Create Part" dialog and validate all key form fields exist
 *   5. Submit a valid part (Name + Description + Category)
 *   6. Assert successful redirect to the new part's detail page
 *   7. Assert the new part name is rendered on the detail page
 *
 * Base URL  : https://demo.inventree.org
 * Auth      : engineer / partsonly
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://demo.inventree.org';
const PARTS_URL = `${BASE_URL}/web/part/`;

// Unique part name per run to avoid collisions
const TEST_PART_NAME = `SmokeTest-Part-${Date.now()}`;
const TEST_PART_DESC = 'Created by Playwright smoke test';

// ---------------------------------------------------------------------------
// Shared Page Fixtures / Helpers
// ---------------------------------------------------------------------------

async function loginViaUI(page: Page): Promise<void> {
  await page.goto(`${BASE_URL}/web/`);
  await page.waitForLoadState('networkidle');

  // If we land on login page fill credentials; otherwise check we are authenticated
  if (page.url().includes('/login')) {
    await page.getByLabel('Username').fill('engineer');
    await page.getByLabel('Password').fill('partsonly');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL(/\/(web\/)?(home|part|stock|manufacturing|logged-in)/, {
      timeout: 15_000,
    });
  }
}

async function navigateToPartsPage(page: Page): Promise<void> {
  await page.goto(PARTS_URL);
  await page.waitForLoadState('networkidle');
  // Ensure the parts table / panel is loaded
  await page
    .getByRole('tab', { name: /Parts/ })
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// SMOKE TEST
// ---------------------------------------------------------------------------

test.describe('Part Creation — End-to-End Smoke Test', () => {
  /**
   * This is the single selected scenario chosen for smoke testing.
   * It covers the full positive creation workflow described in:
   *   Scenario 1 (Positive) under Entity 2: Create Part Form — Required Fields
   */
  test('SMOKE-TC-001: Engineer can create a new part via the "Create Part" form', async ({
    page,
  }) => {
    // -----------------------------------------------------------------------
    // Step 1 — Login
    // -----------------------------------------------------------------------
    await loginViaUI(page);
    expect(page.url()).not.toContain('/login');

    // -----------------------------------------------------------------------
    // Step 2 — Navigate to Parts
    // -----------------------------------------------------------------------
    await navigateToPartsPage(page);

    // -----------------------------------------------------------------------
    // Step 3 — Verify "Add Parts" button is visible
    // -----------------------------------------------------------------------
    const addPartsBtn = page.getByRole('button', { name: 'action-menu-add-parts' });
    await expect(addPartsBtn).toBeVisible({ timeout: 10_000 });

    // -----------------------------------------------------------------------
    // Step 4 — Open dropdown and verify menu items
    // -----------------------------------------------------------------------
    await addPartsBtn.click();

    const createPartItem = page.getByRole('menuitem', {
      name: /action-menu-add-parts-create-part/i,
    });
    const importFileItem = page.getByRole('menuitem', {
      name: /action-menu-add-parts-import-from-file/i,
    });

    await expect(createPartItem).toBeVisible({ timeout: 5_000 });
    await expect(createPartItem).toContainText('Create Part');
    await expect(importFileItem).toBeVisible({ timeout: 5_000 });
    await expect(importFileItem).toContainText('Import from File');

    // -----------------------------------------------------------------------
    // Step 5 — Open "Create Part" dialog
    // -----------------------------------------------------------------------
    await createPartItem.click();

    const dialog = page.getByRole('dialog', { name: 'Add Part' });
    await expect(dialog).toBeVisible({ timeout: 8_000 });

    // Verify key form fields are present
    const nameField = dialog.getByRole('textbox', { name: 'text-field-name' });
    const descField = dialog.getByRole('textbox', { name: 'text-field-description' });
    const categoryCombo = dialog.getByRole('combobox', { name: 'related-field-category' });
    const submitBtn = dialog.getByRole('button', { name: 'Submit' });
    const cancelBtn = dialog.getByRole('button', { name: 'Cancel' });

    await expect(nameField).toBeVisible();
    await expect(descField).toBeVisible();
    await expect(categoryCombo).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // -----------------------------------------------------------------------
    // Step 6 — Fill in the form: Name (required), Description, Category
    // -----------------------------------------------------------------------
    await nameField.fill(TEST_PART_NAME);
    await descField.fill(TEST_PART_DESC);

    // Type in the category combobox and select the first matching option
    await categoryCombo.fill('Electronics');
    // Wait for at least one dropdown option to appear
    const firstOption = page
      .locator('[class*="option"]')
      .filter({ hasText: /Electronics/i })
      .first();
    await firstOption.waitFor({ state: 'visible', timeout: 8_000 });
    await firstOption.click();

    // -----------------------------------------------------------------------
    // Step 7 — Submit
    // -----------------------------------------------------------------------
    await submitBtn.click();

    // -----------------------------------------------------------------------
    // Step 8 — Assert: redirect to new part's detail page
    // -----------------------------------------------------------------------
    await page.waitForURL(/\/web\/part\/\d+\//, { timeout: 15_000 });

    const detailUrl = page.url();
    expect(detailUrl).toMatch(/\/web\/part\/\d+\//);

    // -----------------------------------------------------------------------
    // Step 9 — Assert: the new part name appears on the detail page
    // -----------------------------------------------------------------------
    await expect(page.getByText(TEST_PART_NAME, { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    console.log(
      `✅ SMOKE-TC-001 PASSED — Part "${TEST_PART_NAME}" created at: ${detailUrl}`
    );
  });
});

// ---------------------------------------------------------------------------
// Supporting test: Verify form fields are accessible in the Add Part dialog
// (complementary to the smoke test — validates UI structure independently)
// ---------------------------------------------------------------------------

test.describe('Part Creation Form — Structure Validation', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUI(page);
    await navigateToPartsPage(page);

    // Open the dialog
    await page.getByRole('button', { name: 'action-menu-add-parts' }).click();
    await page
      .getByRole('menuitem', { name: /action-menu-add-parts-create-part/i })
      .click();
    await page.getByRole('dialog', { name: 'Add Part' }).waitFor({ state: 'visible', timeout: 8_000 });
  });

  test('TC-STRUCT-01: Dialog contains all expected input fields', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });

    // Required fields
    await expect(dialog.getByRole('textbox', { name: 'text-field-name' })).toBeVisible();

    // Optional text fields
    await expect(dialog.getByRole('textbox', { name: 'text-field-IPN' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'text-field-description' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'text-field-revision' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'text-field-keywords' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'text-field-units' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'text-field-link' })).toBeVisible();

    // Combobox fields
    await expect(dialog.getByRole('combobox', { name: 'related-field-category' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'related-field-revision_of' })).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'related-field-variant_of' })).toBeVisible();

    // Boolean switches
    await expect(dialog.getByRole('switch', { name: 'boolean-field-component' })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: 'boolean-field-assembly' })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: 'boolean-field-active' })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: 'boolean-field-virtual' })).toBeVisible();
    await expect(dialog.getByRole('switch', { name: 'boolean-field-purchaseable' })).toBeVisible();

    // Action buttons
    await expect(dialog.getByRole('button', { name: 'Submit' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('TC-STRUCT-02: "Active" and "Component" switches are ON by default', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });

    const activeSwitch = dialog.getByRole('switch', { name: 'boolean-field-active' });
    const componentSwitch = dialog.getByRole('switch', { name: 'boolean-field-component' });

    await expect(activeSwitch).toBeChecked();
    await expect(componentSwitch).toBeChecked();
  });

  test('TC-STRUCT-03: Cancel button closes the dialog without creating a part', async ({
    page,
  }) => {
    const dialog = page.getByRole('dialog', { name: 'Add Part' });

    // Fill some data then cancel
    await dialog
      .getByRole('textbox', { name: 'text-field-name' })
      .fill('CancelledPart-Should-Not-Exist');

    await dialog.getByRole('button', { name: 'Cancel' }).click();

    // Dialog should be gone
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });

    // URL should NOT have changed to a new part detail page
    expect(page.url()).not.toMatch(/\/web\/part\/\d+\//);
  });
});
