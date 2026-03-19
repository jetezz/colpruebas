---
name: playwright-generate-test
description: 'Generate a Playwright test based on a scenario using playwright-cli'
allowed-tools: Bash(playwright-cli:*)
metadata:
  id: playwright-generate-test
  version: 1.0.0
---

# Test Generation with playwright-cli

Your goal is to generate a Playwright test based on the provided scenario after completing all prescribed steps.

## Specific Instructions

- You are given a scenario, and you need to generate a playwright test for it. If the user does not provide a scenario, you will ask them to provide one.
- DO NOT generate test code prematurely or based solely on the scenario without completing all prescribed steps.
- DO run steps one by one using `playwright-cli` commands (NOT the Playwright MCP).
- Only after all steps are completed, emit a Playwright TypeScript test that uses `@playwright/test` based on message history
- Save generated test file in the tests directory
- Execute the test file and iterate until the test passes

## OpenCode Agent — Project-Specific Rules

### CRITICAL: Test Directory

**ALL TESTS MUST BE IN `test/` FOLDER — NEVER create tests in `sandbox/tests/`**

### Environment

| Setting | Value |
|---|---|
| **Test URL** | `https://test.colproyects.online` |
| **Test dir** | `test/tests/` |
| **Config** | `test/playwright.config.ts` |
| **Package manager** | `bun` (NEVER npm/npx) |
| **Run command** | `cd test && bun run playwright test` |

### Project Classification

Before saving a new test, classify it into the correct Playwright project:

| If the test... | Assign to project | File location |
|---|---|---|
| Only reads UI, no mutations | `chromium-readonly` | `test/tests/` |
| Calls API without browser | `api` | `test/tests/` |
| Tests login/logout flows | `auth-flow` | `test/tests/` |
| Creates/updates/deletes data | `chromium` or `chromium-stateful` | `test/tests/` |
| Has order-dependent steps (CRUD) | `chromium-stateful` | `test/tests/` |
| Tests infra (tunnel, deploy) | `chromium-infra` | `test/tests/` |

Add the project grep pattern to the test title: `test('test-projectname-description', ...)` matching the pattern in `playwright.config.ts`.

### Shared Helpers (MANDATORY)

Import and use these helpers — never duplicate their logic:

```typescript
import { getApiToken } from './helpers/api-token';
import { workerResourceName, workerTimestampName } from './helpers/worker-resources';
```

- `getApiToken(page)` — Extracts Supabase auth token from the browser session
- `workerResourceName(testInfo, prefix)` — Generates `prefix-worker-N` for parallel-safe resource names
- `workerTimestampName(prefix)` — Generates `prefix-timestamp` for unique names

### Cleanup Rule

Every test that CREATEs a resource MUST DELETE it after assertions:

```typescript
let createdId: string | undefined;
try {
  // create resource, capture ID
  createdId = ...;
  // assertions
} finally {
  if (createdId) {
    await page.request.delete(`${BASE}/api/resource/${createdId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}
```

### Selector Rules

```typescript
// ❌ FORBIDDEN
page.locator('main').filter({ hasText: name })
page.locator('.modal button').last()
page.waitForTimeout(N)

// ✅ REQUIRED
page.locator('.project-card').filter({ hasText: name })
page.locator('.modal-footer button').filter({ hasText: /Confirm/i })
await expect(locator).toBeVisible()
```

### Post-Generation Checklist

1. Run the test: `cd test && bun run playwright test --project=<project> --grep="test-name"`
2. Verify it passes with `--repeat-each=3`
3. Verify cleanup: no orphan resources left in Supabase after run
4. Update `test/TEST_PLAN.md` if a new test file was created
