// Canonical Playwright config (target of the root symlink `playwright.config.ts`).
// The repository's only test discovery root is the canonical `tests/e2e` tree.
// `outputDir='playwright/test-results'` makes the runner's
// readOrder[i]=<REPO_ROOT>/playwright/test-results/.last-run.junit.xml
// hit and parse the JUnit XML.
import { defineConfig } from '@playwright/test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const configDir = dirname(fileURLToPath(import.meta.url));
const baseURL = process.env.BASE_URL?.trim();

export const PWAUTO_VIEWS = {
  'home': { project: 'pwauto-home', bundle_path: 'views/home/index', grep: /@home\b/ },
} as const;

export default defineConfig({
  testDir: resolve(configDir, '../tests/e2e'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  outputDir: resolve(configDir, 'playwright/test-results'),
  reporter: [
    ['list'],
    ['junit', { outputFile: resolve(configDir, 'playwright/test-results', '.last-run.junit.xml') }],
  ],
  use: {
    ...(baseURL ? { baseURL } : {}),
    trace: 'off',
  },
  projects: [
    {
      name: PWAUTO_VIEWS['home'].project,
      testIgnore: /auth\.setup\.ts/,
      grep: PWAUTO_VIEWS['home'].grep,
      workers: 1,
      metadata: {
        view_id: 'home',
        feature_id: null,
        bundle_path: PWAUTO_VIEWS['home'].bundle_path,
        base_url: baseURL,
      },
    },
  ],
});
