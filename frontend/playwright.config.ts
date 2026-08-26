// Canonical Playwright config (target of the root symlink `playwright.config.ts`).
// Derived from `playwright.config.cjs` (source of truth) + design §5.6 `PWAUTO_VIEWS`.
// `outputDir='playwright/test-results'` makes the runner's
// readOrder[i]=<REPO_ROOT>/playwright/test-results/.last-run.junit.xml
// hit and parse the JUnit XML.
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:4321';

export const PWAUTO_VIEWS = {
  'projectctl': { project: 'pwauto-projectctl', bundle_path: 'views/projectctl/index', grep: /@projectctl\b/ },
  'home': { project: 'pwauto-home', bundle_path: 'views/home/index', grep: /@home\b/ },
  'project-workspace:test-tab': {
    project: 'pwauto-test-tab',
    bundle_path: 'views/project-workspace/features/test-tab',
    grep: /@(project-workspace-test-tab|test-tab)\b/,
  },
} as const;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  outputDir: 'playwright/test-results',
  reporter: [
    ['list'],
    ['junit', { outputFile: 'playwright/test-results/.last-run.junit.xml' }],
  ],
  use: {
    baseURL,
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
    {
      name: PWAUTO_VIEWS['project-workspace:test-tab'].project,
      testIgnore: /auth\.setup\.ts/,
      grep: PWAUTO_VIEWS['project-workspace:test-tab'].grep,
      workers: 1,
      metadata: {
        view_id: 'project-workspace',
        feature_id: 'project-workspace-test-tab',
        bundle_path: PWAUTO_VIEWS['project-workspace:test-tab'].bundle_path,
        base_url: baseURL,
      },
    },
    {
      name: PWAUTO_VIEWS['projectctl'].project,
      testIgnore: /auth\.setup\.ts/,
      grep: PWAUTO_VIEWS['projectctl'].grep,
      workers: 1,
      metadata: {
        view_id: 'projectctl',
        feature_id: null,
        bundle_path: PWAUTO_VIEWS['projectctl'].bundle_path,
        base_url: baseURL,
      },
    },
  ],
});
