import { test, expect } from '@playwright/test';

// 🔴 RED PHASE: These tests will fail until implementation is complete
// Frontend baseURL: http://localhost:8086

test.describe('Frontend Tests (RED PHASE - implementation not yet written)', () => {
  test('Home page loads without 404/500 errors', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('Page title contains "colpruebas"', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/colpruebas/i);
  });

  test('Displays correct environment (TEST or PRODUCCIÓN)', async ({ page }) => {
    await page.goto('/');
    const environmentText = page.locator('text=/(TEST|PRODUCCIÓN)/i');
    await expect(environmentText).toBeVisible();
  });

  test('Information card is visible', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('[data-testid="info-card"], .card, article').first();
    await expect(card).toBeVisible();
  });

  test('No JS console errors', async ({ page }) => {
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
