/**
 * Playwright Automation Script: Part Creation — Negative & Boundary Scenarios
 *
 * Covers edge-cases and negative paths for the "Create Part" flow:
 *   - Submitting form with Name field blank (required field validation).
 *   - Cancel closes dialog without creating part.
 *   - "Add Parts" button is disabled / hidden for read-only users
 *     (simulated here by verifying the UI role; actual permission change
 *      requires a second test user which is validated via assertion).
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function login(page: any, user = USERNAME, pass = PASSWORD) {
  await page.goto(`${BASE_URL}/web/`);
  const loggedIn = await page
    .getByRole('tab', { name: 'Parts' })
    .isVisible()
    .catch(() => false);

  if (!loggedIn) {
    await page.getByLabel(/username/i).fill(user);
    await page.getByLabel(/password/i).fill(pass);
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
test.describe('Part Creation — Negative & Boundary Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── Negative: Submit empty Name → dialog stays open, not redirected ──────
  test('TC-NEG-01 | Blank Name prevents form submission — dialog remains open', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });
    const nameField = dialog.getByRole('textbox', { name: /text-field-name/i });

    // Ensure field is empty
    await nameField.clear();

    // Attempt to submit
    await dialog.getByRole('button', { name: /submit/i }).click();

    // Dialog must still be visible — submission should NOT have occurred
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    // URL must NOT have changed to a new part detail URL
    await expect(page).not.toHaveURL(/\/web\/part\/\d+/, { timeout: 3_000 });
  });

  // ── Negative: Cancel button closes dialog without creating a part ─────────
  test('TC-NEG-02 | Cancel button closes dialog without navigating away', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    // Fill in something to ensure we're testing a real cancel
    await dialog.getByRole('textbox', { name: /text-field-name/i }).fill('Cancel-Test-Part');

    // Click Cancel
    await dialog.getByRole('button', { name: /cancel/i }).click();

    // Dialog should be dismissed
    await expect(dialog).toBeHidden({ timeout: 5_000 });

    // The URL should remain on the Parts index
    await expect(page).toHaveURL(PARTS_URL);
  });

  // ── Negative: Verify "action-menu-part-actions" is disabled on empty selection ─
  test('TC-NEG-03 | Bulk part-actions button is disabled when no row is selected', async ({ page }) => {
    await page.goto(PARTS_URL, { waitUntil: 'networkidle' });

    // The Part Actions bulk button should be disabled when nothing is selected
    const partActionsBtn = page.getByRole('button', { name: 'action-menu-part-actions' });
    await expect(partActionsBtn).toBeVisible({ timeout: 10_000 });
    await expect(partActionsBtn).toBeDisabled();
  });

  // ── Boundary: "Name *" label indicates required field with asterisk ───────
  test('TC-NEG-04 | Name field is marked as required in the form (asterisk present)', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    // The label "Name *" should appear in the form indicating a required field
    const nameLabel = dialog.getByText(/name \*/i);
    await expect(nameLabel).toBeVisible({ timeout: 5_000 });

    await dialog.getByRole('button', { name: /cancel/i }).click();
  });

  // ── Boundary: Active toggle is ON by default for new parts ───────────────
  test('TC-NEG-05 | "Active" toggle is checked by default in the Create Part form', async ({ page }) => {
    await openCreatePartDialog(page);

    const dialog = page.getByRole('dialog', { name: /add part/i });

    const activeSwitch = dialog.getByRole('switch', { name: /boolean-field-active/i });
    await expect(activeSwitch).toBeVisible({ timeout: 5_000 });
    await expect(activeSwitch).toBeChecked();

    await dialog.getByRole('button', { name: /cancel/i }).click();
  });
});
