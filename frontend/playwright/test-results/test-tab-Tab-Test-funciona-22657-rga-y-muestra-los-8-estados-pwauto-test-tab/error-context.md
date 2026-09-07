# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test-tab.spec.ts >> Tab Test funcional — @test-tab (PWT-12) >> la página /project/[id]?tab=test carga y muestra los 8 estados
- Location: tests/front/tests/test-tab.spec.ts:10:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="test-tab-section-quickrun"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="test-tab-section-quickrun"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - heading "Project Workspace" [level=1] [ref=e5]
        - code [ref=e6]: 511a017a-01d4-4553-a063-ba01438b15cd
      - generic [ref=e7]:
        - generic [ref=e8]: test
        - text: development
    - generic [ref=e9]:
      - navigation "Tabs del workspace" [ref=e10]:
        - list [ref=e11]:
          - listitem [ref=e12]:
            - generic [ref=e13]: Comandos
          - listitem [ref=e14]:
            - generic [ref=e15]: Skills
          - listitem [ref=e16]:
            - generic [ref=e17]: Agentes
          - listitem [ref=e18]:
            - generic [ref=e19]: Programados
          - listitem [ref=e20]:
            - generic [ref=e21]: Entornos
          - listitem [ref=e22]:
            - generic [ref=e23]: Preview
          - listitem [ref=e24]:
            - link "Test" [ref=e25] [cursor=pointer]:
              - /url: /project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test
      - generic [ref=e26]:
        - text: Este bundle es la única fuente funcional de criterios (
        - code [ref=e27]: docs/app-map/views/project-workspace/features/test-tab.md
        - text: ). Backend lee y escribe el bundle con SHA-256 pre/post + tmp + renameSync.
      - generic [ref=e29]: "Error cargando bundle: network"
  - generic [ref=e32]:
    - button "Menu" [ref=e33]:
      - img [ref=e35]
      - generic: Menu
    - button "Inspect" [ref=e39]:
      - img [ref=e41]
      - generic: Inspect
    - button "Audit" [ref=e43]:
      - img [ref=e45]
      - generic: Audit
    - button "Settings" [ref=e48]:
      - img [ref=e50]
      - generic: Settings
```

# Test source

```ts
  1   | // @ac PWT-01
  2   | // @ac PWT-02
  3   | // @ac PWT-08
  4   | // @ac PWT-09
  5   | // @ac PWT-10
  6   | // @ac PWT-12
  7   | import { test, expect } from '@playwright/test';
  8   | 
  9   | test.describe('Tab Test funcional — @test-tab (PWT-12)', () => {
  10  |   test('la página /project/[id]?tab=test carga y muestra los 8 estados', async ({
  11  |     page,
  12  |   }, testInfo) => {
  13  |     testInfo.annotations.push(
  14  |       { type: 'ac', description: 'PWT-01' },
  15  |       { type: 'ac', description: 'PWT-02' },
  16  |       { type: 'ac', description: 'PWT-08' },
  17  |       { type: 'ac', description: 'PWT-12' },
  18  |     );
  19  | 
  20  |     await page.goto(
  21  |       '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
  22  |     );
  23  | 
  24  |     await expect(page.locator('[data-testid="project-shell-root"]')).toBeVisible();
  25  | 
  26  |     await expect(
  27  |       page.locator('[data-testid="test-tab-section-quickrun"]'),
> 28  |     ).toBeVisible();
      |       ^ Error: expect(locator).toBeVisible() failed
  29  | 
  30  |     await expect(page.locator('[data-testid="test-tab-quickrun-legend"]')).toBeVisible();
  31  | 
  32  |     const expected = [
  33  |       'passed',
  34  |       'manual-evidence',
  35  |       'partial',
  36  |       'not-run',
  37  |       'failed',
  38  |       'manual-missing',
  39  |       'no-test',
  40  |       'not-applicable',
  41  |     ];
  42  |     const dotStates = await page
  43  |       .locator('[data-testid="test-tab-quickrun-legend"] .legend-dot')
  44  |       .evaluateAll((els) => els.map((e) => e.getAttribute('data-state')));
  45  |     for (const s of expected) {
  46  |       expect(dotStates).toContain(s);
  47  |     }
  48  | 
  49  |     const colors = await page
  50  |       .locator('[data-testid="test-tab-quickrun-legend"] .legend-dot')
  51  |       .evaluateAll((els) => els.map((e) => e.className));
  52  |     expect(colors.some((c) => c.includes('legend-dot-red'))).toBe(true);
  53  |     expect(colors.some((c) => c.includes('legend-dot-green'))).toBe(true);
  54  |     expect(colors.some((c) => c.includes('legend-dot-gray'))).toBe(true);
  55  | 
  56  |     await expect(
  57  |       page.locator('[data-testid="test-tab-quickrun-reset-coverage"]'),
  58  |     ).toBeVisible();
  59  | 
  60  |     const rowCount = await page
  61  |       .locator('[data-testid="test-tab-quickrun-criteria-list"] li')
  62  |       .count();
  63  |     expect(rowCount).toBeGreaterThan(0);
  64  | 
  65  |     await expect(
  66  |       page.locator('[data-testid="test-tab-tab-link-test"]').or(
  67  |         page.locator('[data-testid="project-tab-link-test"]'),
  68  |       ),
  69  |     ).toBeVisible();
  70  |   });
  71  | 
  72  |   test('abrir modal Reset coverage muestra texto verbatim del contrato', async ({
  73  |     page,
  74  |   }, testInfo) => {
  75  |     testInfo.annotations.push({ type: 'ac', description: 'PWT-10' });
  76  | 
  77  |     await page.goto(
  78  |       '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
  79  |     );
  80  |     await page
  81  |       .locator('[data-testid="test-tab-quickrun-reset-coverage"]')
  82  |       .click();
  83  |     const modal = page.locator(
  84  |       '[data-testid="test-tab-quickrun-reset-coverage-modal"]',
  85  |     );
  86  |     await expect(modal).toBeVisible();
  87  |     await expect(modal).toContainText('Pendiente');
  88  |     await expect(modal).toContainText('Sin test');
  89  |     await expect(
  90  |       page.locator('[data-testid="test-tab-quickrun-reset-cancel"]'),
  91  |     ).toBeVisible();
  92  |     await expect(
  93  |       page.locator('[data-testid="test-tab-quickrun-reset-confirm"]'),
  94  |     ).toBeVisible();
  95  |     await page
  96  |       .locator('[data-testid="test-tab-quickrun-reset-cancel"]')
  97  |       .click();
  98  |     await expect(modal).toBeHidden();
  99  |   });
  100 | 
  101 |   test('botones per-criterio PW-CLI y Manual existen y abren modales (PWT-09)', async ({
  102 |     page,
  103 |   }, testInfo) => {
  104 |     testInfo.annotations.push({ type: 'ac', description: 'PWT-09' });
  105 | 
  106 |     await page.goto(
  107 |       '/project/511a017a-01d4-4553-a063-ba01438b15cd?tab=test',
  108 |     );
  109 | 
  110 |     await page.waitForSelector('[data-action="pwcli"]', { timeout: 10000 });
  111 | 
  112 |     const pwcliButtons = page.locator('[data-action="pwcli"]');
  113 |     const pwcliCount = await pwcliButtons.count();
  114 |     expect(pwcliCount).toBeGreaterThan(0);
  115 | 
  116 |     const manualButtons = page.locator('[data-action="open-manual-modal"]');
  117 |     const manualCount = await manualButtons.count();
  118 |     expect(manualCount).toBeGreaterThan(0);
  119 | 
  120 |     await pwcliButtons.first().click();
  121 |     const resultModal = page.locator(
  122 |       '[data-testid="test-tab-quickrun-pwcli-result-modal"]',
  123 |     );
  124 |     await expect(resultModal).toBeVisible({ timeout: 10000 });
  125 |     await page
  126 |       .locator('[data-action="close-pwcli-result"]')
  127 |       .first()
  128 |       .click();
```