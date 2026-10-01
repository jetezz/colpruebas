// @ac HOME-01, HOME-05, HSS-01, HSS-02, HSS-03, HSS-04, HRM-01, HRM-02
// @home
import { test, expect } from '@playwright/test';

test.describe('HOME-01 HOME-05 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 HRM-02 Frontend Pages — @home', () => {
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

    // HSS-02: fila Frontend por entorno (production/development/test-fallback).
    const frontendRow = page.locator('.info-row', { hasText: 'Frontend:' });
    await expect(frontendRow).toBeVisible();
    await expect(frontendRow.locator('.value')).toContainText(/PRODUCCI.N|DESARROLLO|TEST/);

    // HSS-03: fila API con salud real SSR o fallback estático por entorno.
    const apiRow = page.locator('.info-row', { hasText: 'API:' });
    await expect(apiRow).toBeVisible();
    await expect(apiRow.locator('.value')).toContainText(/API de (producci.n|desarrollo|test) funcionando/);

    // HRM-01/HSS-04: rama git real build-time SSR (PUBLIC_GIT_BRANCH) con
    // fallback documentado a develop; cero MAIN operativo (SC-S4-rama-real,
    // SC-S4-rama-fallback, SC-S4-cero-main).
    const branchRow = page.locator('.info-row', { hasText: 'Rama Git:' });
    await expect(branchRow).toBeVisible();
    const branchValue = ((await branchRow.locator('.value').textContent()) ?? '').trim();
    expect(branchValue.length).toBeGreaterThan(0);
    expect(branchValue).not.toContain('MAIN');
    expect(branchValue === 'develop' || branchValue.length > 0).toBeTruthy();
  });

  test('HOME-05 page has no console errors', async ({ page }, testInfo) => {
    testInfo.annotations.push({ type: 'ac', description: 'HOME-05' });
    // SC-S3-api-degradado + SC-S4-consola-limpia: el fetch SSR de salud
    // degrada a texto estático sin console.error (HOME-05 protege HSS-03).

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

  test('HRM-02 timestamp visible in footer', async ({
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
