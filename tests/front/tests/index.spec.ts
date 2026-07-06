// @ac HOME-01
// @ac HSS-01
// @ac HSS-02
// @ac HSS-03
// @ac HSS-04
// @ac HRM-01
// @ac HRM-02
// @ac HOME-05
import { test, expect } from '@playwright/test';

test.describe('Frontend Pages', () => {
  test('index page loads correctly', async ({ page }, testInfo) => {
    testInfo.annotations.push(
      { type: 'ac', description: 'HOME-01' },
      { type: 'ac', description: 'HSS-01' },
      { type: 'ac', description: 'HSS-02' },
      { type: 'ac', description: 'HSS-03' },
      { type: 'ac', description: 'HSS-04' },
      { type: 'ac', description: 'HRM-01' },
    );

    await page.goto('/');

    await expect(page).toHaveTitle(/colpruebas/);

    const heading = page.locator('h1');
    await expect(heading).toContainText('colpruebas');

    await expect(page.locator('.info-card')).toBeVisible();

    await expect(page.locator('.info-card')).toContainText('Aplicación:');
    await expect(page.locator('.info-card')).toContainText('colpruebas');

    await expect(page.locator('.info-card')).toContainText('Frontend:');
    await expect(page.locator('.info-card')).toContainText('API:');
    await expect(page.locator('.info-card')).toContainText('Rama Git:');
  });

  test('page has no console errors', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'ac', description: 'HOME-05' });

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

  test('timestamp visible in footer (HRM-02)', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'ac', description: 'HRM-02' });
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    const text = await footer.textContent();
    expect(text ?? '').toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
