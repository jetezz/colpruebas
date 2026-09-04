// @ac HOME-01..HOME-05,HSS-01..HSS-04,HRM-01,HRM-02
//
// Proxy mirror at /home/jete/mis-proyectos/workspace/projects/511a017a-01d4-4553-a063-ba01438b15cd/frontend/__tests__/home/home.test.ts
// Kept in sync with the colpruebas managed project so the parent's
// test-runner.ts @ac-discovery (resolveScopeTestFiles) finds these
// `@ac` headers when run from inside the sandbox (REPO_ROOT falls back
// to managed-project cwd). The runner globs
// `frontend/__tests__/**/*.test.ts`, finds this file, and matches its
// `criterionIds` against the resolved scope's ids.
//
// The first 10 lines are intentionally reserved for `@ac` headers since
// the parent runner only scans the first 10 lines per file. Use multiple
// @ac PWT-XX in `test-tab/proxy.test.ts` for project-workspace:test-tab scope.

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const PROJECT_BUNDLES = {
  homeIndex: `/workspace/projects/${PROJECT_ID}/docs/app-map/views/home/index.md`,
  statusSummary: `/workspace/projects/${PROJECT_ID}/docs/app-map/views/home/features/status-summary.md`,
  runtimeMetadata: `/workspace/projects/${PROJECT_ID}/docs/app-map/views/home/features/runtime-metadata.md`,
};

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

describe('colpruebas managed project · home view proxy', () => {
  it('HOME bundle declares HOME-01..HOME-05', () => {
    const raw = readBundle(PROJECT_BUNDLES.homeIndex);
    expect(raw).not.toBeNull();
    const ids = parseIds(raw ?? '');
    for (const id of ['HOME-01', 'HOME-02', 'HOME-03', 'HOME-04', 'HOME-05']) {
      expect(ids).toContain(id);
    }
  });

  it('HSS bundle declares HSS-01..HSS-04', () => {
    const raw = readBundle(PROJECT_BUNDLES.statusSummary);
    expect(raw).not.toBeNull();
    const ids = parseIds(raw ?? '');
    for (const id of ['HSS-01', 'HSS-02', 'HSS-03', 'HSS-04']) {
      expect(ids).toContain(id);
    }
  });

  it('HRM bundle declares HRM-01..HRM-02', () => {
    const raw = readBundle(PROJECT_BUNDLES.runtimeMetadata);
    expect(raw).not.toBeNull();
    const ids = parseIds(raw ?? '');
    expect(ids).toContain('HRM-01');
    expect(ids).toContain('HRM-02');
  });
});
