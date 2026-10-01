#!/usr/bin/env bun
/** SDD satellite binding and artifact integrity check. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { assertMachineBaseline, generatePhaseStateSchema, parseBindingFile, resolveLaneSkillContext } from './task-flow-normalizer.ts';
import { parseCriteriaChange } from '../project/criteria-change.ts';

const RETIRED = ['ready_for_branch', 'branching', 'pushing', 'verified', 'completed', 'paused', 'phase1_generating', 'phase2_branching', 'phase3_implementing', 'phase4_pushing'];
const INCLUDED_PACKAGE = [
  '.agents/skills/projectctl-sdd/SKILL.md',
  '.agents/skills/projectctl-sdd/references/tasks/binding.md',
  '.agents/skills/projectctl-sdd/references/sources.md',
  '.agents/skills/projectctl-sdd/references/maintenance.md',
  '.agents/skills/projectctl-sdd/references/decisions.md',
  '.agents/skills/projectctl-sdd/generated/phase-state-schema.json',
];
const EXCLUDED = [
  'taskReadme/<task_id>-<task_slug>.md#historical_other_than_active',
  '.agents/skills/sdd-tasks/tasks.md',
  'openspec/**', 'proposals/**', 'specs/**', 'designs/**', 'tasks/**',
];
const TEMPLATES = [
  '.agents/skills/projectctl-sdd/assets/task-template.md',
  '.agents/skills/projectctl-sdd/assets/examples/task-browser-feature.md',
];

function checkSkillFrontmatter(repoRoot: string, failures: string[]): void {
  const rel = '.agents/skills/projectctl-sdd/SKILL.md';
  const abs = resolve(repoRoot, rel);
  if (!existsSync(abs)) {
    failures.push(`skill missing: ${rel}`);
    return;
  }
  const raw = readFileSync(abs, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    failures.push('skill frontmatter missing: SKILL.md must start with ---...---');
    return;
  }
  const front = match[1];
  const get = (key: string): string | null => {
    const m = front.match(new RegExp(`^\\s*${key}:\\s*(.+?)\\s*$`, 'm'));
    return m ? (m[1] as string).trim().replace(/^["']|["']$/g, '') : null;
  };
  const id = get('id');
  const version = get('version');
  if (id !== 'projectctl-sdd') failures.push(`skill metadata.id must equal projectctl-sdd, got=${JSON.stringify(id)}`);
  if (!version || !/^\d+\.\d+\.\d+$/.test(version)) failures.push(`skill metadata.version must be semver X.Y.Z, got=${JSON.stringify(version)}`);
  for (const key of ['layer', 'type', 'sot_policy', 'install', 'license']) {
    if (!get(key)) failures.push(`skill metadata.${key} missing: ${rel}`);
  }
}

export type SddCheckMode = 'package' | 'installed';

export function checkSdd(repoRoot: string = resolve(import.meta.dir, '../../../../..'), options: { mode?: SddCheckMode } = {}): { ok: boolean; failures: string[] } {
  const mode: SddCheckMode = options.mode ?? 'installed';
  const failures: string[] = [];
  checkSkillFrontmatter(repoRoot, failures);
  try {
    const parsed = parseBindingFile(repoRoot);
    const { binding } = parsed;
    if (mode === 'installed') {
      assertMachineBaseline(repoRoot);
    } else {
      assertMachineBaseline(repoRoot, { skipLocator: true });
    }
    const projection = resolve(repoRoot, '.agents/skills/projectctl-sdd/generated/phase-state-schema.json');
    if (!existsSync(projection) || readFileSync(projection, 'utf8') !== generatePhaseStateSchema(parsed)) failures.push('base projection stale');
    for (const lane of Object.keys(binding.lanes as Record<string, unknown>)) resolveLaneSkillContext(repoRoot, binding, lane);
    if (binding.binding_id !== 'projectctl-requirements.task-flow') failures.push('binding_id must equal projectctl-requirements.task-flow');
    if (binding.binding_version !== '15.0.0') failures.push(`binding_version must equal 15.0.0, got=${JSON.stringify(binding.binding_version)}`);
    const retired = binding.retired_aliases;
    if (!Array.isArray(retired)) failures.push('binding retired_aliases must be an array');
    else for (const alias of RETIRED) if (!retired.includes(alias)) failures.push(`retired_aliases missing: ${alias}`);
    const writable = binding.status?.writable;
    if (!Array.isArray(writable)) failures.push('binding status.writable must be an array');
    else for (const alias of RETIRED) if (writable.includes(alias)) failures.push(`retired alias is writable (must not be): ${alias}`);
    const include = binding.active_sources?.include;
    const exclude = binding.active_sources?.exclude;
    if (!Array.isArray(include)) failures.push('binding active_sources.include must be an array');
    else {
      for (const rel of INCLUDED_PACKAGE) if (!include.includes(rel)) failures.push(`active_sources.include missing: ${rel}`);
      if (include.length !== INCLUDED_PACKAGE.length) failures.push(`active_sources.include must have exactly ${INCLUDED_PACKAGE.length} entries, got=${include.length}`);
    }
    if (!Array.isArray(exclude)) failures.push('binding active_sources.exclude must be an array');
    else for (const rel of EXCLUDED) if (!exclude.includes(rel)) failures.push(`active_sources.exclude missing: ${rel}`);
  } catch (error) {
    failures.push(`binding unparseable: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const rel of TEMPLATES) {
    const abs = resolve(repoRoot, rel);
    if (!existsSync(abs)) failures.push(`task-template missing: ${rel}`);
    else if (!readFileSync(abs, 'utf8').trim()) failures.push(`task-template empty: ${rel}`);
  }
  try {
    parseCriteriaChange(readFileSync(resolve(repoRoot, '.agents/skills/projectctl-sdd/assets/proposal-template.md'), 'utf8'));
  } catch (error) { failures.push(`canonical proposal template invalid: ${String(error)}`); }
  return { ok: failures.length === 0, failures };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(
      [
        'Usage: bun .agents/skills/projectctl-sdd/scripts/skill/sdd-check.ts [--check|--check-installed|--check-package] [--mode package|installed]',
        '',
        'Modes (compat fail-closed):',
        '  installed (default): validates package + binding + instance locator (.agents/sdd-workflow.json).',
        '    --check (no modifier) = installed; --check-installed is the explicit alias.',
        '  package: validates the portable copy-tree without the instance locator (skips locator).',
        '    --check-package or --mode package.',
      ].join('\n'),
    );
    process.exit(0);
  }
  let mode: SddCheckMode = 'installed';
  if (argv.includes('--check-package')) mode = 'package';
  else if (argv.includes('--check-installed')) mode = 'installed';
  else {
    const modeFlag = argv.find((entry) => entry === '--mode' || entry.startsWith('--mode='));
    if (modeFlag) {
      const eq = modeFlag.indexOf('=');
      const value = eq >= 0
        ? modeFlag.slice(eq + 1)
        : argv[argv.indexOf(modeFlag) + 1];
      if (value !== 'package' && value !== 'installed') {
        console.error(`[sdd-check] FAIL invalid --mode ${JSON.stringify(value)} (expected package|installed)`);
        process.exit(2);
      }
      mode = value;
    }
  }
  const result = checkSdd(undefined, { mode });
  for (const failure of result.failures) console.error(`[sdd-check:${mode}] FAIL ${failure}`);
  if (result.ok) console.log(`[sdd-check:${mode}] ok — binding + canonical criteria policy + active_sources + proposal/task templates`);
  process.exit(result.ok ? 0 : 1);
}
