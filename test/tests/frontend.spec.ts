import { test, expect } from '@playwright/test';

test.describe('Frontend Tests (RED PHASE - implementation not yet written)', () => {
  test('Home page loads without 404/500 errors', async ({ page }) => {
    // TDD: red phase — implementation not yet written
    const response = await page.goto('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('Page title contains "colpruebas"', async ({ page }) => {
    // TDD: red phase — implementation not yet written
    await page.goto('/');
    await expect(page).toHaveTitle(/colpruebas/i);
  });

  test('Displays correct environment (TEST or PRODUCCION)', async ({ page }) => {
    // TDD: red phase — implementation not yet written
    await page.goto('/');
    const environmentText = page.locator('text=/(TEST|PRODUCCIÓN)/i');
    await expect(environmentText).toBeVisible();
  });

  test('Information card is visible', async ({ page }) => {
    // TDD: red phase — implementation not yet written
    await page.goto('/');
    const card = page.locator('[data-testid="info-card"], .card, article').first();
    await expect(card).toBeVisible();
  });

  test('No JS console errors', async ({ page }) => {
    // TDD: red phase — implementation not yet written
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(consoleErrors).toHaveLength(0);
  });
});
