// @ac TST-36
// @ac TST-38
//
// Canonical App Map / sot-coherence contract for the home-only managed repo
// (HOME-3). Replaces the deleted v9 projectctl-scoped coherence test with a
// bounded gate against the v10 task-flow binding and the Home test contract.
//
// Platform contract IDs (not `test-tab` bundle ACs): TST-36 (canonical layout
// + discovery `tests/unit` + `tests/e2e`) and TST-38 (code⇒criterion
// traceability against `docs/app-map`). Every assertion below is explicit —
// no generic inline-code scanner. A new anti-drift claim MUST be added here
// as a dedicated assertion.
//
// Portable paths: REPO_ROOT resolves from the environment or from this file's
// location. NO `/workspace` hardcodes (TST-36 portability).
//
// Run directly (not via runner inventory — `frontend/__tests__` is outside
// the canonical discovery roots by contract):
//   bun test frontend/__tests__/projectctl-requirements.sot-coherence.test.ts

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function resolveRepoRoot(): string {
  const envRoot = process.env.PROJECTS_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 4; i++) {
    try {
      fs.accessSync(join(dir, 'docs', 'app-map'));
      return dir;
    } catch {
      dir = dirname(dir);
    }
  }
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
}

const REPO_ROOT = resolveRepoRoot();

const BINDING_PATH = `${REPO_ROOT}/.agents/skills/projectctl-requirements/references/tasks/binding.md`;
const LOCATOR_PATH = `${REPO_ROOT}/.agents/sdd-workflow.json`;
const SCHEMA_PATH = `${REPO_ROOT}/.agents/skills/projectctl-requirements/generated/phase-state-schema.json`;
const CLIENT_VIEW_MODEL_PATH = `${REPO_ROOT}/frontend/src/views/projectctl/data/tareas-tab.view-model.ts`;
const CLIENT_GENERATED_TS_PATH = `${REPO_ROOT}/frontend/src/shared/sdd/task-flow.generated.ts`;

const EXPECTED_CONTRACT_KIND = 'TaskFlowBindingV2';
const EXPECTED_BINDING_VERSION = '10.0.0';
const EXPECTED_BINDING_ID = 'projectctl-requirements.task-flow';
const EXPECTED_MODEL_VERSION = 2;
const EXPECTED_LOCATOR_CONTRACT = 2;
const MACHINE_BLOCK_ID = 'task-flow-binding';

// Retired status aliases of the v10 binding (never writable).
const RETIRED_STATUS_ALIASES = [
  'ready_for_branch',
  'branching',
  'pushing',
  'verified',
];

// Home contract: the only view + its bundles and criteria.
const HOME_BUNDLES = [
  'views/home/index',
  'views/home/features/status-summary',
  'views/home/features/runtime-metadata',
];
const HOME_CRITERIA = [
  'HOME-01',
  'HOME-05',
  'HSS-01',
  'HSS-02',
  'HSS-03',
  'HSS-04',
  'HRM-01',
  'HRM-02',
];

function readFile(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

interface Locator {
  contract_version?: unknown;
  binding_path?: unknown;
  machine_block_id?: unknown;
  expected_binding_id?: unknown;
  expected_binding_version?: unknown;
  projections?: Record<string, string>;
}

/** Extracts the single fenced JSON inside the `task-flow-binding` marker block. */
function extractBindingBlock(raw: string): Record<string, unknown> | null {
  const lines = raw.split('\n');
  const open = lines.findIndex((l) => l.trim() === '<!-- task-flow-binding:start -->');
  const close = lines.findIndex((l) => l.trim() === '<!-- task-flow-binding:end -->');
  if (open === -1 || close === -1 || close <= open) return null;
  const between = lines.slice(open + 1, close).join('\n');
  const m = between.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Extracts the single-quoted string members of an exported array-literal
 * constant from a generated TS projection (scoped to the constant's own
 * declaration so sibling constants never collide).
 */
function extractArrayLiteralMembers(raw: string, constName: string): string[] {
  const re = new RegExp(
    `export\\s+const\\s+${constName}\\b[^=]*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s+const\\s*;`,
    'm',
  );
  const m = raw.match(re);
  if (!m) return [];
  const members: string[] = [];
  for (const line of m[1].split('\n')) {
    const mm = line.match(/^\s*'([^']+)',?\s*$/);
    if (mm) members.push(mm[1]);
  }
  return members;
}

interface BundleCriterion {
  id?: string;
  functional?: string;
  coverage?: Record<string, string>;
}

/** Minimal frontmatter criteria parse (mirrors scripts/test-runner.ts). */
function extractCriteria(src: string): BundleCriterion[] {
  const match = /^---\n([\s\S]*?)\n---/.exec(src);
  if (!match) return [];
  const body = match[1];
  const out: BundleCriterion[] = [];
  const blocks = body.split(/(?=^\s*- id:)/gm);
  for (const block of blocks) {
    if (!/^\s*- id:/m.test(block)) continue;
    const entry: BundleCriterion = {};
    const id = /^\s*- id:\s*(.+)$/m.exec(block);
    if (id) entry.id = id[1].trim();
    const functional = /^\s*functional:\s*(.+)$/m.exec(block);
    if (functional) entry.functional = functional[1].trim();
    const coverage: Record<string, string> = {};
    const covRe = /^\s*(Unit|PW-CLI|PW-AUTO|Manual):\s*(.+)$/gm;
    let cm: RegExpExecArray | null;
    while ((cm = covRe.exec(block))) {
      coverage[cm[1]] = cm[2].trim();
    }
    if (Object.keys(coverage).length > 0) entry.coverage = coverage;
    out.push(entry);
  }
  return out;
}

describe('home-only repo · App Map / sot-coherence contract (TST-36 / TST-38)', () => {
  const bindingRaw = readFile(BINDING_PATH);
  const locatorRaw = readFile(LOCATOR_PATH);
  const binding = bindingRaw ? extractBindingBlock(bindingRaw) : null;
  const locator: Locator | null = locatorRaw ? (JSON.parse(locatorRaw) as Locator) : null;

  it('binding file exists and exposes a single task-flow-binding machine block', () => {
    expect(bindingRaw).not.toBeNull();
    const lines = (bindingRaw ?? '').split('\n');
    const open = lines.filter((l) => l.trim() === '<!-- task-flow-binding:start -->').length;
    const close = lines.filter((l) => l.trim() === '<!-- task-flow-binding:end -->').length;
    expect(open).toBe(1);
    expect(close).toBe(1);
    expect(binding).not.toBeNull();
  });

  it('binding identifies as TaskFlowBindingV2 projectctl-requirements.task-flow v10.0.0', () => {
    expect(binding?.contract_kind).toBe(EXPECTED_CONTRACT_KIND);
    expect(binding?.binding_id).toBe(EXPECTED_BINDING_ID);
    expect(binding?.binding_version).toBe(EXPECTED_BINDING_VERSION);
    expect(binding?.model_version).toBe(EXPECTED_MODEL_VERSION);
  });

  it('all active_sources.include canonical paths exist', () => {
    const include = ((binding?.active_sources as { include?: unknown })?.include ?? []) as string[];
    expect(include.length).toBeGreaterThan(0);
    for (const rel of include) {
      expect(readFile(`${REPO_ROOT}/${rel}`)).not.toBeNull();
    }
  });

  it('locator pins binding v10 and points to the binding + machine block', () => {
    expect(locator).not.toBeNull();
    expect(locator?.contract_version).toBe(EXPECTED_LOCATOR_CONTRACT);
    expect(locator?.binding_path).toBe('.agents/skills/projectctl-requirements/references/tasks/binding.md');
    expect(locator?.machine_block_id).toBe(MACHINE_BLOCK_ID);
    expect(locator?.expected_binding_id).toBe(EXPECTED_BINDING_ID);
    expect(locator?.expected_binding_version).toBe(EXPECTED_BINDING_VERSION);
  });

  it('locator projections resolve to existing platform files', () => {
    const projections = locator?.projections ?? {};
    expect(Object.keys(projections).length).toBeGreaterThan(0);
    for (const p of Object.values(projections)) {
      expect(typeof p).toBe('string');
      expect(readFile(`${REPO_ROOT}/${p as string}`)).not.toBeNull();
    }
    // The SDD platform projections kept by HOME-3 decision (not Test-tab code).
    expect(readFile(CLIENT_VIEW_MODEL_PATH)).not.toBeNull();
    expect(readFile(CLIENT_GENERATED_TS_PATH)).not.toBeNull();
  });

  it('generated STATUS_WRITABLE carries only binding-known statuses and excludes retired aliases', () => {
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH) ?? '';
    const writableMembers = extractArrayLiteralMembers(generatedTsRaw, 'STATUS_WRITABLE');
    expect(writableMembers.length).toBeGreaterThan(0);
    const bindingWritable = ((binding?.status as { writable?: unknown })?.writable ?? []) as string[];
    for (const s of writableMembers) {
      expect(bindingWritable).toContain(s);
    }
    for (const alias of RETIRED_STATUS_ALIASES) {
      expect(writableMembers).not.toContain(alias);
    }
  });

  it('known gap (tripwire): v10 reviewing status pending projection regeneration', () => {
    // The v10 binding declares `reviewing` in status.writable but the committed
    // client projections were generated from an older digest. Regeneration runs
    // via the `taskflow:generate` owner lane (see binding.md) — generated files
    // forbid hand edits, so HOME-3 does NOT patch them. If this tripwire fails
    // because the projections now include `reviewing`, the gap is closed:
    // delete this test and restore the exact-mirror assertion.
    const bindingWritable = ((binding?.status as { writable?: unknown })?.writable ?? []) as string[];
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH) ?? '';
    const writableMembers = extractArrayLiteralMembers(generatedTsRaw, 'STATUS_WRITABLE');
    expect(bindingWritable).toContain('reviewing');
    expect(writableMembers).not.toContain('reviewing');
  });

  it('generated RETIRED_ALIASES preserves the retired status aliases', () => {
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH) ?? '';
    const retiredMembers = extractArrayLiteralMembers(generatedTsRaw, 'RETIRED_ALIASES');
    expect(retiredMembers.length).toBeGreaterThan(0);
    for (const alias of RETIRED_STATUS_ALIASES) {
      expect(retiredMembers).toContain(alias);
    }
  });

  it('navigation is home-only and every bundle carries criteria[] with coverage', () => {
    const navRaw = readFile(`${REPO_ROOT}/docs/app-map/navigation.yaml`);
    expect(navRaw).not.toBeNull();
    expect(navRaw ?? '').toContain('root_id: home');
    expect(navRaw ?? '').not.toContain('project-workspace');
    expect(navRaw ?? '').not.toContain('projectctl');
    for (const rel of HOME_BUNDLES) {
      expect(navRaw ?? '').toContain(`bundle: ${rel}`);
      const criteria = extractCriteria(readFile(`${REPO_ROOT}/docs/app-map/${rel}.md`) ?? '');
      expect(criteria.length).toBeGreaterThan(0);
      for (const c of criteria) {
        expect(c.id).toBeTypeOf('string');
        expect(c.functional).toBeTypeOf('string');
        expect(c.coverage?.Unit).toBeTypeOf('string');
        expect(c.coverage?.['PW-AUTO']).toBeTypeOf('string');
      }
    }
    const declared = HOME_BUNDLES.flatMap((rel) =>
      extractCriteria(readFile(`${REPO_ROOT}/docs/app-map/${rel}.md`) ?? '').map((c) => c.id),
    );
    for (const id of HOME_CRITERIA) {
      expect(declared).toContain(id);
    }
  });

  it('TEST_PLAN maps the persistent Home spec and all eight criteria', () => {
    const plan = readFile(`${REPO_ROOT}/playwright/TEST_PLAN.md`);
    expect(plan).not.toBeNull();
    expect(plan ?? '').toContain('tests/e2e/home/index.spec.ts');
    expect(plan ?? '').toContain('pwauto-home');
    for (const id of HOME_CRITERIA) {
      expect(plan ?? '').toContain(id);
    }
  });

  it('single Playwright config discovers tests/e2e with a home-only PWAUTO_VIEWS', () => {
    const cfg = readFile(`${REPO_ROOT}/frontend/playwright.config.ts`);
    expect(cfg).not.toBeNull();
    expect(cfg ?? '').toContain('tests/e2e');
    expect(cfg ?? '').toContain(`'home'`);
    expect(cfg ?? '').toContain('views/home/index');
    expect(cfg ?? '').not.toContain('projectctl');
    expect(cfg ?? '').not.toContain('test-tab');
    expect(fs.existsSync(`${REPO_ROOT}/playwright.config.cjs`)).toBe(false);
    expect(fs.existsSync(`${REPO_ROOT}/playwright.config.js`)).toBe(false);
  });

  it('package.json scripts expose home runners and no legacy back/front entries', () => {
    const pkg = JSON.parse(readFile(`${REPO_ROOT}/package.json`) ?? '{}') as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};
    for (const name of ['test:unit:home', 'test:pwauto:home', 'test:all:home', 'test:check']) {
      expect(scripts[name]).toBeTypeOf('string');
    }
    expect(scripts['test:back']).toBeUndefined();
    expect(scripts['test:front']).toBeUndefined();
    expect(scripts['test:unit:home'] ?? '').toContain('--target=home');
    expect(scripts['test:pwauto:home'] ?? '').toContain('--target=home');
    expect(scripts['test:all:home'] ?? '').toContain('--target=home');
  });

  it('canonical layout holds @ac tests and legacy test roots carry no specs', () => {
    const unitFiles = fs
      .readdirSync(`${REPO_ROOT}/tests/unit/home`)
      .filter((f) => f.endsWith('.test.ts'));
    expect(unitFiles.length).toBeGreaterThan(0);
    for (const f of unitFiles) {
      const src = readFile(`${REPO_ROOT}/tests/unit/home/${f}`) ?? '';
      expect(src).toContain('// @ac ');
    }
    const e2eSrc = readFile(`${REPO_ROOT}/tests/e2e/home/index.spec.ts`) ?? '';
    expect(e2eSrc).toContain('// @ac ');
    expect(fs.existsSync(`${REPO_ROOT}/tests/back`)).toBe(false);
    expect(fs.existsSync(`${REPO_ROOT}/tests/front/tests/index.spec.ts`)).toBe(false);
    expect(fs.existsSync(`${REPO_ROOT}/tests/front/tests/test-tab.spec.ts`)).toBe(false);
  });

  it('orphan Test-tab fetch layer is gone from the frontend', () => {
    expect(fs.existsSync(`${REPO_ROOT}/frontend/src/pages/api/[...path].ts`)).toBe(false);
    expect(fs.existsSync(`${REPO_ROOT}/frontend/src/lib/test-api.ts`)).toBe(false);
    expect(fs.existsSync(`${REPO_ROOT}/frontend/src/lib/test-status.ts`)).toBe(false);
  });

  it('no /workspace hardcodes in the canonical test platform', () => {
    const roots = [
      `${REPO_ROOT}/scripts/test-runner.ts`,
      `${REPO_ROOT}/backend/src/test-inventory.ts`,
      `${REPO_ROOT}/backend/src/coverage-writer.ts`,
      `${REPO_ROOT}/frontend/playwright.config.ts`,
    ];
    for (const p of roots) {
      expect(readFile(p) ?? '').not.toContain('/workspace');
    }
    for (const dir of [`${REPO_ROOT}/tests/unit/home`, `${REPO_ROOT}/tests/e2e/home`]) {
      for (const f of fs.readdirSync(dir)) {
        expect(readFile(`${dir}/${f}`) ?? '').not.toContain('/workspace');
      }
    }
  });

  it('default bundle path and runner default target are home', () => {
    expect(readFile(`${REPO_ROOT}/backend/src/coverage-writer.ts`) ?? '').toContain(
      'docs/app-map/views/home/index.md',
    );
    const runner = readFile(`${REPO_ROOT}/scripts/test-runner.ts`) ?? '';
    expect(runner).toContain(`let targetSpec = 'home'`);
    expect(runner).not.toContain(`let targetSpec = 'projectctl'`);
  });

  it('taskReadme/*.md frontmatter never uses a retired status alias', () => {
    const dir = `${REPO_ROOT}/taskReadme`;
    if (!fs.existsSync(dir)) return;
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);
    expect(files.length).toBeGreaterThan(0);
    const retiredRe = new RegExp(`^status:\\s*(${RETIRED_STATUS_ALIASES.join('|')})\\b`, 'm');
    for (const file of files) {
      const content = readFile(`${dir}/${file}`) ?? '';
      expect(content.match(retiredRe), `retired status alias in ${file}`).toBeNull();
    }
  });
});
