import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test('should connect wallet successfully', async ({ page }) => {
    await page.goto('/');

    // Check initial state
    await expect(page.getByText('Wallet Not Connected')).toBeVisible();

    // Connect wallet
    await page.getByRole('button', { name: 'Get Started - Connect Wallet' }).click();

    // Verify connection
    await expect(page.getByText('Wallet Connected Successfully!')).toBeVisible();
    await expect(page.getByText('Connected')).toBeVisible();
  });

  test('should display account information after connection', async ({ page }) => {
    await page.goto('/');

    // Connect wallet
    await page.getByRole('button', { name: 'Get Started - Connect Wallet' }).click();

    // Wait for connection
    await expect(page.getByText('Wallet Connected Successfully!')).toBeVisible();

    // Check account info is displayed
    await expect(page.getByText('Active Account')).toBeVisible();
    await expect(page.locator('[id="active-account"]')).toBeVisible();
  });

  test('should show multiple accounts', async ({ page }) => {
    await page.goto('/');

    // Connect wallet
    await page.getByRole('button', { name: 'Get Started - Connect Wallet' }).click();

    // Navigate to accounts page
    await page.getByRole('link', { name: 'Accounts' }).click();

    // Check accounts are listed
    await expect(page.getByText('Your Accounts')).toBeVisible();
    await expect(page.getByText('Total Accounts')).toBeVisible();
  });
});