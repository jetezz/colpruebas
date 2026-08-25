// @ac PCT-83 PCT-84 PCT-85 PCT-86 PCT-87 PCT-88
//
// Unit test for the `docs/app-map/views/projectctl/index.md` bundle (REQ-TST-006/007,
// AD-09 flat layout). Validates the 5 MUST sections, the frontmatter `criteria[]` contract
// `{id,title,functional,coverage}` with the PCT-* prefix discipline, the sibling `index.mmd`
// diagram, the `projectctl` entry in `docs/app-map/navigation.yaml`, and the absence of the
// legacy `docs/01-product/quality-plan.md` / `quality-status.md` surface.
//
// The first 10 lines are reserved for the `@ac` header because the runner
// (`scripts/test-runner.ts` assertAcHeader) only scans that range and rejects the file with
// exit 2 when the header is missing.

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const REPO_ROOT = `/workspace/projects/${PROJECT_ID}`;

const BUNDLE_PATH = `${REPO_ROOT}/docs/app-map/views/projectctl/index.md`;
const MMD_PATH = `${REPO_ROOT}/docs/app-map/views/projectctl/index.mmd`;
const NAVIGATION_PATH = `${REPO_ROOT}/docs/app-map/navigation.yaml`;
const QUALITY_LEGACY_SURFACE = `${REPO_ROOT}/docs/01-product`;

/** The 5 canonical MUST sections a bundle must declare (REQ-DOC-001 / PCT-84). */
const MUST_SECTIONS = [
  '## 1. URL',
  '## 2. Tab',
  '## 3. Objetivo',
  '## 4. Criterios de calidad',
  '## 5. Diagrama Mermaid',
];

/** The implemented doc criteria this bundle must declare (REQ-DOC-001..005). */
const IMPLEMENTED_DOC_CRITERIA = [
  'PCT-83',
  'PCT-84',
  'PCT-85',
  'PCT-86',
  'PCT-87',
  'PCT-88',
];

function readFile(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

interface CriteriaEntry {
  id?: unknown;
  title?: unknown;
  functional?: unknown;
  coverage?: unknown;
}

function parseCriteria(raw: string): CriteriaEntry[] {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return [];
  try {
    const parsed = Bun.YAML.parse(m[1]) as { criteria?: unknown } | null;
    if (!parsed || !Array.isArray(parsed.criteria)) return [];
    return parsed.criteria as CriteriaEntry[];
  } catch {
    return [];
  }
}

describe('colpruebas managed project · projectctl bundle (AC-003 / REQ-TST-006/007)', () => {
  const raw = readFile(BUNDLE_PATH);
  const body = raw ?? '';

  it('bundle file exists', () => {
    expect(raw).not.toBeNull();
  });

  it('declares the 5 canonical MUST sections', () => {
    for (const section of MUST_SECTIONS) {
      expect(body).toContain(section);
    }
  });

  it('declares sibling index.mmd diagram present', () => {
    expect(readFile(MMD_PATH)).not.toBeNull();
  });

  it('is registered with a projectctl entry in navigation.yaml', () => {
    const nav = readFile(NAVIGATION_PATH);
    expect(nav).not.toBeNull();
    expect(nav ?? '').toMatch(/^\s*-\s+id:\s*projectctl\b/m);
    expect(nav ?? '').toContain('bundle: views/projectctl/index');
  });

  it('frontmatter criteria[] declares the implemented doc criteria PCT-83..PCT-88', () => {
    const ids = parseCriteria(body).map((c) => c.id);
    for (const id of IMPLEMENTED_DOC_CRITERIA) {
      expect(ids).toContain(id);
    }
  });

  it('frontmatter criteria[] entries follow the {id,title,functional,coverage} contract', () => {
    const entries = parseCriteria(body);
    expect(entries.length).toBeGreaterThan(0);
    for (const c of entries) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.title).toBe('string');
      expect(typeof c.functional).toBe('string');
      expect(c.coverage).toBeTypeOf('object');
      expect(c.coverage).not.toBeNull();
    }
  });

  it('all criteria ids use the reserved PCT-* prefix (prefix discipline PCT-88)', () => {
    const ids = parseCriteria(body)
      .map((c) => c.id)
      .filter((id): id is string => typeof id === 'string');
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(id).toMatch(/^PCT-\d+$/);
    }
  });

  it('frontmatter criteria[] functional values are valid', () => {
    const entries = parseCriteria(body);
    const valid = ['implemented', 'not-applicable'];
    for (const c of entries) {
      expect(valid).toContain(c.functional);
    }
  });

  it('legacy quality-plan.md / quality-status.md surface is absent (REQ-DOC-004)', () => {
    expect(readFile(`${QUALITY_LEGACY_SURFACE}/quality-plan.md`)).toBeNull();
    expect(readFile(`${QUALITY_LEGACY_SURFACE}/quality-status.md`)).toBeNull();
    expect(readFile(path.join(QUALITY_LEGACY_SURFACE, 'quality', 'quality-plan.md'))).toBeNull();
    expect(readFile(path.join(QUALITY_LEGACY_SURFACE, 'quality', 'quality-status.md'))).toBeNull();
  });
});
