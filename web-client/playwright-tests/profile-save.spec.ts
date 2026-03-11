import { test, expect } from '@playwright/test';
import { loginAsUser, TEST_ADOPTER, TEST_VENDOR } from './helpers/auth';

test.describe('Adopter Edit Profile Save', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page, TEST_ADOPTER);
  });

  test('should save adopter profile data and persist it on reload', async ({ page }) => {
    // Navigate to adopter profile
    await page.goto('/profile/adopter');
    await expect(page.getByRole('heading', { name: 'My Profile' })).toBeVisible();
    // Fill in household size
    const householdSizeInput = page.getByLabel('Household Size');
    await householdSizeInput.clear();
    await householdSizeInput.fill('4');
    // Select home type
    const homeTypeSelect = page.getByLabel('Home Type');
    await homeTypeSelect.selectOption('HOUSE');
    // Toggle checkboxes (sr-only inputs with custom toggle overlay, need force: true)
    const hasChildrenToggle = page.getByLabel('I have children');
    if (!(await hasChildrenToggle.isChecked())) {
      await hasChildrenToggle.check({ force: true });
    }
    const hasYardToggle = page.getByLabel('I have a yard');
    if (!(await hasYardToggle.isChecked())) {
      await hasYardToggle.check({ force: true });
    }
    // Fill in additional notes
    const notesTextarea = page.getByLabel('Additional Notes');
    await notesTextarea.clear();
    await notesTextarea.fill('Looking for a medium-sized dog, good with kids.');
    // Submit the form
    await page.getByRole('button', { name: /Create Profile|Update Profile/ }).click();
    // Wait for the page to reload after redirect
    await page.waitForURL('/profile/adopter');
    // Verify data persisted by checking the form values after reload
    await expect(page.getByLabel('Household Size')).toHaveValue('4');
    await expect(page.getByLabel('Home Type')).toHaveValue('HOUSE');
    await expect(page.getByLabel('I have children')).toBeChecked();
    await expect(page.getByLabel('I have a yard')).toBeChecked();
    await expect(page.getByLabel('Additional Notes')).toHaveValue(
      'Looking for a medium-sized dog, good with kids.'
    );
  });
});

test.describe('Adopter Profile Save - Unhappy Paths', () => {
  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access the adopter profile without logging in
    await page.goto('/profile/adopter');

    // Should be redirected to the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect vendor user away from adopter profile', async ({ page }) => {
    // Log in as a vendor
    await loginAsUser(page, TEST_VENDOR);

    // Try to access the adopter profile page
    await page.goto('/profile/adopter');

    // Should be redirected away (to /profile which redirects based on user type)
    await expect(page).not.toHaveURL(/\/profile\/adopter/);
  });
});
