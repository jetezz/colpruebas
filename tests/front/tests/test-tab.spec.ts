// @ac PWT-01
// @ac PWT-02
// @ac PWT-08
// @ac PWT-09
// @ac PWT-10
// @ac PWT-12
import { test, expect } from '@playwright/test';

test.describe('Tab Test funcional — colpruebas (PWT-12)', () => {
  test.use({
    baseURL: 'http://localhost:4323',
  });

  test('la página /project/[id]?tab=test carga y muestra los 8 estados', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: 'ac', description: 'PWT-01' },
      { type: 'ac', description: 'PWT-02' },
      { type: 'ac', description: 'PWT-08' },
      { type: 'ac', description: 'PWT-12' },
    );

    await page.goto(
      '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
    );

    await expect(page.locator('[data-testid="project-shell-root"]')).toBeVisible();

    await expect(
      page.locator('[data-testid="test-tab-section-quickrun"]'),
    ).toBeVisible();

    await expect(page.locator('[data-testid="test-tab-quickrun-legend"]')).toBeVisible();

    const expected = [
      'passed',
      'manual-evidence',
      'partial',
      'not-run',
      'failed',
      'manual-missing',
      'no-test',
      'not-applicable',
    ];
    const dotStates = await page
      .locator('[data-testid="test-tab-quickrun-legend"] .legend-dot')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-state')));
    for (const s of expected) {
      expect(dotStates).toContain(s);
    }

    const colors = await page
      .locator('[data-testid="test-tab-quickrun-legend"] .legend-dot')
      .evaluateAll((els) => els.map((e) => e.className));
    expect(colors.some((c) => c.includes('legend-dot-red'))).toBe(true);
    expect(colors.some((c) => c.includes('legend-dot-green'))).toBe(true);
    expect(colors.some((c) => c.includes('legend-dot-gray'))).toBe(true);

    await expect(
      page.locator('[data-testid="test-tab-quickrun-reset-coverage"]'),
    ).toBeVisible();

    const rowCount = await page
      .locator('[data-testid="test-tab-quickrun-criteria-list"] li')
      .count();
    expect(rowCount).toBeGreaterThan(0);

    await expect(
      page.locator('[data-testid="test-tab-tab-link-test"]').or(
        page.locator('[data-testid="project-tab-link-test"]'),
      ),
    ).toBeVisible();
  });

  test('abrir modal Reset coverage muestra texto verbatim del contrato', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'ac', description: 'PWT-10' });

    await page.goto(
      '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
    );
    await page
      .locator('[data-testid="test-tab-quickrun-reset-coverage"]')
      .click();
    const modal = page.locator(
      '[data-testid="test-tab-quickrun-reset-coverage-modal"]',
    );
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Pendiente');
    await expect(modal).toContainText('Sin test');
    await expect(
      page.locator('[data-testid="test-tab-quickrun-reset-cancel"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="test-tab-quickrun-reset-confirm"]'),
    ).toBeVisible();
    await page
      .locator('[data-testid="test-tab-quickrun-reset-cancel"]')
      .click();
    await expect(modal).toBeHidden();
  });

  test('botones per-criterio PW-CLI y Manual existen y abren modales (PWT-09)', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'ac', description: 'PWT-09' });

    await page.goto(
      '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
    );

    await page.waitForSelector('[data-action="pwcli"]', { timeout: 10000 });

    const pwcliButtons = page.locator('[data-action="pwcli"]');
    const pwcliCount = await pwcliButtons.count();
    expect(pwcliCount).toBeGreaterThan(0);

    const manualButtons = page.locator('[data-action="open-manual-modal"]');
    const manualCount = await manualButtons.count();
    expect(manualCount).toBeGreaterThan(0);

    await pwcliButtons.first().click();
    const resultModal = page.locator(
      '[data-testid="test-tab-quickrun-pwcli-result-modal"]',
    );
    await expect(resultModal).toBeVisible({ timeout: 10000 });
    await page
      .locator('[data-action="close-pwcli-result"]')
      .first()
      .click();

    await manualButtons.first().click();
    const dialog = page.locator('.criterion-manual-dialog[open]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    await page.keyboard.press('Escape');
  });
});
