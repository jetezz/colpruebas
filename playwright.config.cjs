// Plain CJS config that doesn't import @playwright/test (avoids the
// "Requiring @playwright/test second time" error when both project's
// playwright and bunx playwright are loaded into the same process).
// outputDir='playwright/test-results' makes the runner's
// readOrder[i]=<REPO_ROOT>/playwright/test-results/.last-run.junit.xml
// hit and parse the JUnit XML.
module.exports = {
  testDir: './frontend/tests',
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
    baseURL: process.env.BASE_URL || 'http://localhost:4321',
    trace: 'off',
  },
  projects: [
    {
      name: 'pwauto-home',
      testIgnore: /auth\.setup\.ts/,
      grep: /@home\b/,
      workers: 1,
      metadata: {
        view_id: 'home',
        feature_id: null,
        bundle_path: 'views/home/index',
        base_url: process.env.BASE_URL || 'http://localhost:4321',
      },
    },
    {
      name: 'pwauto-test-tab',
      testIgnore: /auth\.setup\.ts/,
      grep: /@(project-workspace-test-tab|test-tab)\b/,
      workers: 1,
      metadata: {
        view_id: 'project-workspace',
        feature_id: 'project-workspace-test-tab',
        bundle_path: 'views/project-workspace/features/test-tab',
        base_url: process.env.BASE_URL || 'http://localhost:4321',
      },
    },
  ],
};
