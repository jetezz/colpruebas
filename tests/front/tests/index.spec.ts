import { test, expect } from '@playwright/test';

test.describe('Frontend Pages', () => {
  test('index page loads correctly', async ({ page }) => {
    await page.goto('/');

    // Check title contains app name
    await expect(page).toHaveTitle(/colpruebas/);

    // Check main heading exists
    const heading = page.locator('h1');
    await expect(heading).toContainText('colpruebas');

    // Check info card elements exist
    await expect(page.locator('.info-card')).toBeVisible();

    // Check that app name is displayed in info card
    await expect(page.locator('.info-card')).toContainText('Aplicación:');
    await expect(page.locator('.info-card')).toContainText('colpruebas');

    // Check frontend status is shown
    await expect(page.locator('.info-card')).toContainText('Frontend:');

    // Check API status is shown
    await expect(page.locator('.info-card')).toContainText('API:');

    // Check git branch is shown
    await expect(page.locator('.info-card')).toContainText('Rama Git:');
  });

  test('page has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });
});
