// @ac PCT-106 PCT-107 PCT-109 PCT-110 PCT-112 PCT-121
//
// Gate R-007 (maintenance §4 / REQ-TST-007 / REQ-TSK-004): unit test that enforces the
// anti-drift coherence of the `projectctl-requirements` task-flow standard against the
// repo state. This is a bounded gate: every assertion is explicit, there is no generic
// scanner of inline-code paths. A new anti-drift claim MUST be added here as a dedicated
// assertion (maintenance §4).
//
// Checks (enzyme against the actual binding locator + projections):
//   - canonical paths (active_sources.include + projections + locator) exist
//   - locator pins binding_version 9.0.0 and a single task-flow-binding machine block
//   - both client projections + generated schema present and coherent with v9.0.0
//   - no duplicate operational catalog (single machine block; legacy exclude roots absent)
//   - retired status aliases are never used as writable status and never appear in
//     taskReadme/*.md frontmatter
//
// The first 10 lines are reserved for the `@ac` header because the runner
// (`scripts/test-runner.ts` assertAcHeader) only scans that range.

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const REPO_ROOT = `/workspace/projects/${PROJECT_ID}`;

const BINDING_PATH = `${REPO_ROOT}/.agents/skills/projectctl-requirements/references/tareas.md`;
const LOCATOR_PATH = `${REPO_ROOT}/.agents/sdd-workflow.json`;
const SCHEMA_PATH = `${REPO_ROOT}/.agents/skills/projectctl-requirements/generated/phase-state-schema.json`;
const CLIENT_VIEW_MODEL_PATH = `${REPO_ROOT}/frontend/src/views/projectctl/data/tareas-tab.view-model.ts`;
const CLIENT_GENERATED_TS_PATH = `${REPO_ROOT}/frontend/src/shared/sdd/task-flow.generated.ts`;

const EXPECTED_BINDING_VERSION = '9.0.0';
const EXPECTED_BINDING_ID = 'projectctl-requirements.task-flow';
const MACHINE_BLOCK_ID = 'task-flow-binding';

/** Retired status aliases declared in the binding's retired_aliases (never writable). */
const RETIRED_STATUS_ALIASES = ['branching', 'pushing', 'ready_for_branch', 'verified'];

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
  binding_version?: unknown;
  projections?: Record<string, string>;
}

/** Extracts the single fenced JSON inside the `task-flow-binding` marker block. */
function extractBindingBlock(raw: string): Record<string, unknown> | null {
  const open = raw.split('\n').findIndex((l) => l.trim() === '<!-- task-flow-binding:start -->');
  const close = raw.split('\n').findIndex((l) => l.trim() === '<!-- task-flow-binding:end -->');
  if (open === -1 || close === -1 || close <= open) return null;
  const between = raw.split('\n').slice(open + 1, close).join('\n');
  const m = between.match(/```json\s*\n([\s\S]*?)\n```/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Extracts the single-quoted string members of an exported array-literal constant
 * from a generated TS projection (e.g. STATUS_WRITABLE or RETIRED_ALIASES). The
 * match is scoped to the constant's own declaration block so that a whole-file
 * regex can never collide with a sibling constant that legitimately contains the
 * same values (F1: STATUS_WRITABLE vs RETIRED_ALIASES in task-flow.generated.ts).
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

describe('colpruebas managed project · projectctl-requirements R-007 coherence (AC-004)', () => {
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

  it('binding identifies as projectctl-requirements.task-flow v9.0.0', () => {
    expect(binding?.binding_id).toBe(EXPECTED_BINDING_ID);
    expect(binding?.binding_version).toBe(EXPECTED_BINDING_VERSION);
    expect(binding?.model_version).toBe(1);
  });

  it('all active_sources.include canonical paths exist', () => {
    const include = ((binding?.active_sources as { include?: unknown })?.include ?? []) as string[];
    expect(include.length).toBeGreaterThan(0);
    for (const rel of include) {
      expect(readFile(`${REPO_ROOT}/${rel}`)).not.toBeNull();
    }
  });

  it('legacy exclude roots carry no active parallel catalog (no duplicate catalog)', () => {
    const exclude = ((binding?.active_sources as { exclude?: unknown })?.exclude ?? []) as string[];
    const roots = ['openspec', 'proposals', 'specs', 'designs', 'tasks'];
    // Every exclude root that is a concrete dir must NOT exist as an active operational
    // catalog duplicating the binding machine values.
    for (const root of roots) {
      expect(exclude.some((e) => e.startsWith(`${root}/`)) || exclude.includes(root)).toBe(true);
      if (fs.existsSync(`${REPO_ROOT}/${root}`)) {
        expect(false, `legacy exclude root present and active: ${root}`).toBe(true);
      }
    }
  });

  it('locator pins binding_version 9.0.0 and points to the binding + machine block', () => {
    expect(locator).not.toBeNull();
    expect(locator?.contract_version).toBe(1);
    expect(locator?.binding_path).toBe('.agents/skills/projectctl-requirements/references/tareas.md');
    expect(locator?.machine_block_id).toBe(MACHINE_BLOCK_ID);
    expect(locator?.expected_binding_id).toBe(EXPECTED_BINDING_ID);
    expect(locator?.binding_version).toBe(EXPECTED_BINDING_VERSION);
  });

  it('locator binding_path resolves to a file exposing the binding block', () => {
    expect(locator?.binding_path).toBeTypeOf('string');
    const resolved = readFile(`${REPO_ROOT}/${locator?.binding_path as string}`);
    expect(resolved).not.toBeNull();
    expect(resolved ?? '').toContain(`<!-- ${MACHINE_BLOCK_ID}:start -->`);
  });

  it('both client projections + generated schema exist and are coherent with v9.0.0', () => {
    const schemaRaw = readFile(SCHEMA_PATH);
    const viewModelRaw = readFile(CLIENT_VIEW_MODEL_PATH);
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH);
    expect(schemaRaw).not.toBeNull();
    expect(viewModelRaw).not.toBeNull();
    expect(generatedTsRaw).not.toBeNull();

    // schema projection points to the binding and pins the same version
    expect(schemaRaw ?? '').toContain(`"binding_version": "${EXPECTED_BINDING_VERSION}"`);
    expect(schemaRaw ?? '').toContain(`"binding_id": "${EXPECTED_BINDING_ID}"`);

    // both client projections are derived from the v9.0.0 binding
    for (const proj of [viewModelRaw ?? '', generatedTsRaw ?? '']) {
      expect(proj).toContain('task-flow-binding');
      expect(proj).toContain(`v${EXPECTED_BINDING_VERSION}`);
    }
  });

  it('locator projections resolve to existing files', () => {
    const projections = locator?.projections ?? {};
    for (const p of Object.values(projections)) {
      expect(typeof p).toBe('string');
      expect(readFile(`${REPO_ROOT}/${p as string}`)).not.toBeNull();
    }
  });

  it('retired status aliases are never declared as writable status', () => {
    expect(binding?.status).toBeTypeOf('object');
    const writable = (binding?.status as { writable?: unknown })?.writable ?? [];
    for (const alias of RETIRED_STATUS_ALIASES) {
      expect(writable).not.toContain(alias);
    }
  });

  it('generated client projection STATUS_WRITABLE mirrors the binding writable statuses and excludes retired aliases', () => {
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH) ?? '';
    // F1: parse ONLY the STATUS_WRITABLE array literal. A whole-file regex would
    // collide with the legitimate RETIRED_ALIASES constant that intentionally
    // contains retired status values (task-flow.generated.ts L263-267).
    const writableMembers = extractArrayLiteralMembers(generatedTsRaw, 'STATUS_WRITABLE');
    expect(writableMembers.length).toBeGreaterThan(0);
    // Coherence: the generated writable set equals the binding's status.writable.
    const bindingWritable = (binding?.status as { writable?: unknown })?.writable ?? [];
    expect(writableMembers).toEqual(bindingWritable);
    for (const alias of RETIRED_STATUS_ALIASES) {
      expect(writableMembers).not.toContain(alias);
    }
  });

  it('generated client projection RETIRED_ALIASES preserves the retired status aliases', () => {
    const generatedTsRaw = readFile(CLIENT_GENERATED_TS_PATH) ?? '';
    const retiredMembers = extractArrayLiteralMembers(generatedTsRaw, 'RETIRED_ALIASES');
    expect(retiredMembers.length).toBeGreaterThan(0);
    for (const alias of RETIRED_STATUS_ALIASES) {
      expect(retiredMembers).toContain(alias);
    }
  });

  it('taskReadme/*.md frontmatter never uses a retired status alias', () => {
    const dir = `${REPO_ROOT}/taskReadme`;
    const files = fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);
    expect(files.length).toBeGreaterThan(0);
    const retiredRe = new RegExp(
      `^status:\\s*(${RETIRED_STATUS_ALIASES.join('|')})\\b`,
      'm',
    );
    for (const file of files) {
      const content = readFile(`${dir}/${file}`) ?? '';
      expect(content.match(retiredRe), `retired status alias in ${file}`).toBeNull();
    }
  });
});
