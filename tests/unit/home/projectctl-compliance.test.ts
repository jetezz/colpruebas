// @ac HOME-01 HOME-05 HSS-01 HSS-02 HSS-03 HSS-04 HRM-01 HRM-02
import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = join(import.meta.dir, '../../..');

const read = (path: string) => readFileSync(join(repoRoot, path), 'utf8');
const exists = (path: string) => existsSync(join(repoRoot, path));

function parseEnv(path: string): Record<string, string> {
  return Object.fromEntries(
    read(path)
      .split('\n')
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => [match[1], match[2]]),
  );
}

function serviceBlock(compose: string, service: string): string {
  const match = new RegExp(
    `^  ${service.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}:.*?(?=^  \\S+:|^networks:|(?![\\s\\S]))`,
    'ms',
  ).exec(compose);
  expect(match, `service ${service} must be declared`).not.toBeNull();
  return match?.[0] ?? '';
}

describe('projectctl compliance contract', () => {
  it('keeps the seven core folders and only justified conditional folders', () => {
    const core = ['frontend', 'backend', 'shared', 'docs', 'tests', 'scripts', 'deploy'];
    const conditional = ['supabase', 'compose', '.agents'];

    for (const folder of core) {
      expect(exists(folder), `${folder}/ is required by the 7+3 baseline`).toBe(true);
      expect(readdirSync(join(repoRoot, folder)).length, `${folder}/ must not be empty`).toBeGreaterThan(0);
    }

    for (const folder of conditional) {
      if (!exists(folder)) continue;
      expect(readdirSync(join(repoRoot, folder)).length, `${folder}/ must not be empty`).toBeGreaterThan(0);
    }

    const structure = read('.agents/skills/projectctl-requirements/references/estructura.md');
    expect(structure).toContain('baseline de estructura 7+3');
    expect(structure).toContain('| `backend/src/` | `apps/api-bun/src/`, `api/src/` |');
    expect(exists('api/src')).toBe(true);
    expect(exists('backend/src')).toBe(true);
  });

  it('pins the workflow locator to the v10 binding and preserves its machine block', () => {
    const locator = JSON.parse(read('.agents/sdd-workflow.json')) as Record<string, unknown>;
    expect(locator.binding_path).toBe('.agents/skills/projectctl-requirements/references/tasks/binding.md');
    expect(locator.machine_block_id).toBe('task-flow-binding');
    expect(locator.expected_binding_id).toBe('projectctl-requirements.task-flow');
    expect(locator.expected_binding_version).toBe('10.0.0');

    const binding = read('.agents/skills/projectctl-requirements/references/tasks/binding.md');
    expect(binding).toContain('version: 10.0.0');
    const block = /<!-- task-flow-binding:start -->\n```json\n([\s\S]*?)\n```\n<!-- task-flow-binding:end -->/.exec(binding);
    expect(block, 'binding must contain one delimited JSON machine block').not.toBeNull();
    const machine = JSON.parse(block?.[1] ?? '{}') as {
      contract_kind?: string;
      binding_version?: string;
      status?: { writable?: string[] };
      lanes?: Record<string, unknown>;
      active_sources?: { include?: string[]; exclude?: string[] };
    };

    expect(machine.contract_kind).toBe('TaskFlowBindingV2');
    expect(machine.binding_version).toBe('10.0.0');
    expect(machine.status?.writable).toContain('testing');
    expect(machine.status?.writable).not.toContain('verified');
    expect(machine.lanes).toHaveProperty('sdd-apply-unit-tests');
    expect(machine.lanes).toHaveProperty('sdd-apply-pwauto-tests');
    expect(machine.active_sources?.include).toContain('.agents/sdd-workflow.json');
    expect(machine.active_sources?.exclude).toContain('.agents/skills/projectctl-requirements/references/tareas.md');
  });

  it('keeps the skill registry present and project-scoped', () => {
    const registryPath = '.atl/skill-registry.md';
    expect(exists(registryPath)).toBe(true);
    const registry = read(registryPath);
    expect(registry).toContain('project-scoped skills installed');
    expect(registry).toContain('`projectctl-requirements`');
    expect(registry).toContain('.agents/skills/projectctl-requirements/SKILL.md');
  });

  it('keeps production and development compose ports explicit and separate', () => {
    const prodEnv = parseEnv('.env.example');
    const devEnv = parseEnv('.env.dev.example');
    expect(prodEnv.FRONTEND_PORT).toBe('4321');
    expect(devEnv.FRONTEND_DEV_PORT).toBe('4324');
    expect(prodEnv.FRONTEND_PORT).not.toBe(devEnv.FRONTEND_DEV_PORT);
    expect(prodEnv.API_PORT).toBeDefined();
    expect(devEnv.API_DEV_PORT).toBeDefined();
    expect(prodEnv.API_PORT).not.toBe(devEnv.API_DEV_PORT);

    const prod = read('compose/compose.prod.yml');
    const dev = read('compose/compose.dev.yml');
    const base = read('compose/compose.yml');
    expect(exists('compose/compose.yml')).toBe(true);
    expect(serviceBlock(prod, 'frontend-prod')).toContain('${FRONTEND_PORT}:4321');
    expect(serviceBlock(dev, 'frontend-dev')).toContain('${FRONTEND_DEV_PORT}:4321');
    expect(serviceBlock(prod, 'api-prod')).toContain('${API_PORT}:3000');
    expect(serviceBlock(dev, 'api-dev')).toContain('${API_DEV_PORT}:3000');
    expect(prod).toContain('colpruebas-origin');
    expect(dev).toContain('test-colpruebas-origin');
    expect(base).toContain('external: true');
  });

  it('exposes portable projectctl, docs, taskflow, and doctor commands', () => {
    const packageJson = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    expect(packageJson.scripts.projectctl).toContain('scripts/projectctl-root.ts');
    for (const script of ['docs:lint', 'docs:check', 'docs:status', 'docs:generate']) {
      expect(packageJson.scripts[script]).toMatch(/^bun(?: run)? scripts\/projectctl-docs\.ts/);
    }
    for (const script of ['taskflow:check', 'taskflow:generate']) {
      expect(packageJson.scripts[script]).toMatch(/^bun(?: run)? scripts\/taskflow\.ts/);
    }
    expect(packageJson.scripts['sdd:doctor']).toMatch(/^bun(?: run)? scripts\/sdd-doctor\.ts/);

    const root = read('scripts/projectctl-root.ts');
    expect(root).toContain("docs: 'projectctl-docs.ts'");
    expect(root).toContain("doctor: 'sdd-doctor.ts'");
    expect(root).toContain("taskflow: 'taskflow.ts'");
    expect(root).toContain("test: 'test-runner.ts'");
    expect(root).toContain('shell: false');
    expect(exists('scripts/projectctl-docs.ts')).toBe(true);
    expect(exists('scripts/taskflow.ts')).toBe(true);
    expect(exists('scripts/sdd-doctor.ts')).toBe(true);
    expect(statSync(join(repoRoot, 'scripts/projectctl-root.ts')).isFile()).toBe(true);
  });
});
