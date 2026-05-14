import { test, expect } from '@playwright/test';

/**
 * Test Suite: InvenTree Demo Site Verification
 *
 * This test suite automates the following scenario:
 *  1. Navigate to the InvenTree demo site (https://demo.inventree.org/)
 *  2. Verify that the text "InvenTree demo" is visible on the page
 */

test.describe('InvenTree Demo Site - Navigation and Text Verification', () => {

  test('should navigate to InvenTree demo and verify "InvenTree demo" text is visible', async ({ page }) => {

    // Step 1: Navigate to the InvenTree demo site
    // The site may redirect to the login page, which still contains the "InvenTree demo" text
    await page.goto('https://demo.inventree.org/');

    // Step 2: Wait for the page to fully load by checking the page title
    // Expected title: "InvenTree Demo Server"
    await expect(page).toHaveTitle(/InvenTree Demo Server/i);

    // Step 3: Verify that the text "InvenTree demo" is visible on the page
    // The login page displays: "InvenTree demo instance - Click here for login details"
    const inventreeText = page.getByText(/InvenTree demo/i);
    await expect(inventreeText).toBeVisible();

    // Step 4: Log success message for traceability
    console.log('✅ "InvenTree demo" text is visible on the page. Test PASSED.');
  });

});
