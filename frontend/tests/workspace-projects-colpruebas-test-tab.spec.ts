// @project-workspace-test-tab managed project proxy. Test names include
// criterion IDs in scope (pwt-01..pwt-12 lowercased) so the runner's
// `--grep` filter finds this spec.

import { test, expect } from '@playwright/test';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';

test.describe('@project-workspace-test-tab colpruebas proxy', () => {
  test('pwt-01 pwt-02 pwt-03 pwt-04 pwt-05 pwt-06 pwt-07 pwt-08 pwt-09 pwt-10 pwt-11 pwt-12', async ({
    page,
    baseURL,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: 'ac', description: 'PWT-01' },
      { type: 'ac', description: 'PWT-08' },
      { type: 'ac', description: 'PWT-10' },
      { type: 'ac', description: 'PWT-12' },
    );

    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'e2e.public@colpruebas.online');
    await page.fill('input[name="password"]', 'ColpruebasE2E2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.endsWith('/login'));

    await page.goto(`${baseURL}/project/${PROJECT_ID}?tab=test`);
    await expect(
      page.locator('[data-testid="test-tab-quickrun-legend"]'),
    ).toBeVisible({ timeout: 15000 });
  });
});
