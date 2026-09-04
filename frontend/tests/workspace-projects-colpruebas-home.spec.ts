// @home colpruebas-managed · home view · proxy mirror
//
// Mirrors the project's own landing-renders-criteria test. Naming
// convention: each test name includes the criterion IDs in scope
// (e.g. `home-01 home-02 ... home-05 hss-01...hss-04`) so the parent's
// `runPwAuto` `--grep=<lowercased ids joined by |>` filter finds the
// spec. The describe name `@home` is the project tag for the
// `pwauto-home` Playwright project (per
// /home/jete/mis-proyectos/playwright.config.ts:106).

import { test, expect } from '@playwright/test';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';

test.describe('@home colpruebas landing renders 5 criterios (HOME-01..05)', () => {
  test('home-01 home-02 home-03 home-04 home-05 hss-01 hss-02 hss-03 hss-04 hrm-01 hrm-02', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: 'ac', description: 'HOME-01' },
      { type: 'ac', description: 'HOME-02' },
      { type: 'ac', description: 'HOME-03' },
      { type: 'ac', description: 'HOME-04' },
      { type: 'ac', description: 'HOME-05' },
    );

    await page.goto('/login');
    await page.fill('input[name="email"]', 'e2e.public@colpruebas.online');
    await page.fill('input[name="password"]', 'ColpruebasE2E2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    await page.goto(`/project/${PROJECT_ID}?tab=test`);
    await expect(
      page.locator('[data-testid="test-tab-quickrun-legend"]'),
    ).toBeVisible({ timeout: 15000 });

    const expectedStates = [
      'passed',
      'manual-evidence',
      'partial',
      'not-run',
      'failed',
      'manual-missing',
      'no-test',
      'not-applicable',
    ];
    const states = await page
      .locator('[data-testid="test-tab-quickrun-legend"] .legend-dot')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-state')));
    for (const s of expectedStates) expect(states).toContain(s);
  });
});
