import { type Page, expect } from '@playwright/test';

/**
 * Logs in a user through the login page UI.
 * After calling this, the page will be redirected to the home page.
 */
export async function loginAsUser(
  page: Page,
  credentials: { email: string; password: string }
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  // Wait for navigation away from the login page
  await page.waitForURL((url) => !url.pathname.includes('/login'));
}

/**
 * Default test adopter credentials.
 * Set these via environment variables or update the defaults for your test DB.
 */
export const TEST_ADOPTER = {
  email: process.env.TEST_ADOPTER_EMAIL ?? 'adopter@gmail.com',
  password: process.env.TEST_ADOPTER_PASSWORD ?? 'adopterpass',
};

export const TEST_VENDOR = {
  email: process.env.TEST_VENDOR_EMAIL ?? 'vendor@gmail.com',
  password: process.env.TEST_VENDOR_PASSWORD ?? 'vendorpass',
};
