// @ac PWT-01..PWT-12
//
// Proxy mirror for the project-workspace:test-tab scope. The parent
// runner's resolveScopeTestFiles globs
// `frontend/__tests__/**/*.test.ts` from REPO_ROOT (which inside the
// sandbox falls back to managed-project cwd). The first 10 lines are
// reserved for `@ac` headers because the runner only scans that range.

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const TEST_TAB_BUNDLE = `/workspace/projects/${PROJECT_ID}/docs/app-map/views/project-workspace/features/test-tab.md`;

function readBundle(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

function parseIds(raw: string): string[] {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [];
  try {
    const parsed = Bun.YAML.parse(m[1]) as { criteria?: Array<{ id?: string }> } | null;
    if (!parsed || !Array.isArray(parsed.criteria)) return [];
    return parsed.criteria
      .map((c) => (c && typeof c.id === 'string' ? c.id : ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}

describe('colpruebas managed project · project-workspace:test-tab proxy', () => {
  it('test-tab bundle declares PWT-01..PWT-12', () => {
    const raw = readBundle(TEST_TAB_BUNDLE);
    expect(raw).not.toBeNull();
    const ids = parseIds(raw ?? '');
    const pwts = ids.filter((id) => /^PWT-\d+$/.test(id));
    expect(pwts.length).toBe(12);
  });
});
