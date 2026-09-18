// @ac HOME-01
// @ac HSS-01
// @ac HSS-02
// @ac HSS-03
// @ac HSS-04
// @ac HRM-01
// @ac HRM-02
// @ac HOME-05
import { test, expect } from '@playwright/test';

test.describe('Frontend Pages — @home', () => {
  test('HOME-01 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 home identity and status summary render correctly', async ({ page }, testInfo) => {
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

    await expect(page.getByRole('heading', { name: 'colpruebas' })).toBeVisible();

    const statusSummary = page.locator('.info-card');
    await expect(statusSummary).toBeVisible();
    await expect(statusSummary).toContainText('Aplicación:');
    await expect(statusSummary).toContainText('colpruebas');
    await expect(statusSummary).toContainText('Frontend:');
    await expect(statusSummary).toContainText('API:');
    await expect(statusSummary).toContainText('Rama Git:');
    await expect(statusSummary).toContainText('MAIN');
  });

  test('HOME-05 page has no console errors', async ({ page }, testInfo) => {
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
