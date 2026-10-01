// @ac AC-TSK-05, AC-TSK-06, AC-TSK-11 — immutable task-skill capture,
// mandatory-before-optional resolution, and portable binding alignment.

import { afterEach, describe, expect, it } from 'bun:test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  captureTaskSelectedSkills,
  resolveLaneSkillContext,
} from '../skill/task-flow-normalizer.ts';
import { MAP_SCHEMA_ID, sha256OfString } from '../skill/sdd-map.ts';

const SNAPSHOT = (ids: string[]) => `# Task\n\n## Task skill snapshot\n\nSchema: \`task-skills/v1\`\n\n\`\`\`json\n${JSON.stringify({ skills: ids.map((id) => ({ id, label: id })) }, null, 2)}\n\`\`\`\n`;

const SKILL = (id: string) => `---\nmetadata:\n  id: ${id}\n---\n\n# ${id}\n`;

const fixtures: string[] = [];

async function fixture(): Promise<{ root: string; taskFile: string }> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'task-skill-coord-'));
  fixtures.push(root);
  await fs.mkdir(path.join(root, '.agents', 'skills'), { recursive: true });
  const taskFile = 'task.md';
  await fs.writeFile(path.join(root, taskFile), SNAPSHOT([]));
  return { root, taskFile };
}

async function install(root: string, directory: string, id: string): Promise<string> {
  const skillDir = path.join(root, '.agents', 'skills', directory);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(path.join(skillDir, 'SKILL.md'), SKILL(id));
  return `.agents/skills/${directory}/SKILL.md`;
}

type MapFixtureRow = {
  readonly id: string;
  readonly modulo: string;
  readonly proposito: string;
  readonly autoridad?: string;
  readonly status?: string;
};

/**
 * Writes the canonical MAP.md that the v10 `resolveLaneSkillContext` contract
 * requires: `resolveProjectctlModule` looks lanes up through the MAP module
 * resolver, so a synthetic lane must have a `current` MAP row whose `módulo`
 * exists on disk. The `source_revision` digest is computed exactly as
 * `projectctl-manifest.parseProjectctlMap` recomputes it, otherwise the
 * resolver fails closed with `module_revision_mismatch`.
 */
async function installMap(root: string, rows: readonly MapFixtureRow[]): Promise<void> {
  const mapDir = path.join(root, '.agents', 'skills', 'projectctl-sdd');
  await fs.mkdir(mapDir, { recursive: true });
  const autoridad = (row: MapFixtureRow) => row.autoridad ?? 'binding';
  const status = (row: MapFixtureRow) => row.status ?? 'current';
  const tableCanonical = rows
    .map((row) => [row.id, row.modulo, row.proposito, autoridad(row), '', '', status(row)].join('|'))
    .join('\n');
  const revision = sha256OfString(`${MAP_SCHEMA_ID}\n${tableCanonical}\n`);
  const content = [
    `schema: ${MAP_SCHEMA_ID}`,
    `source_revision: ${revision}`,
    '',
    '| id | módulo | propósito | autoridad | status |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.id} | ${row.modulo} | ${row.proposito} | ${autoridad(row)} | ${status(row)} |`),
    '',
  ].join('\n');
  await fs.writeFile(path.join(mapDir, 'MAP.md'), content);
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe('WU-UT-COORD-01 — canonical reread and immutable execution capture', () => {
  it('reopens the task file per execution and keeps the prior capture immutable', async () => {
    const { root, taskFile } = await fixture();
    const firstPath = await install(root, 'first', 'helper-a');
    await fs.writeFile(path.join(root, taskFile), SNAPSHOT(['helper-a']));

    const first = captureTaskSelectedSkills(root, taskFile);
    await fs.writeFile(path.join(root, taskFile), SNAPSHOT(['helper-b']));
    const secondPath = await install(root, 'second', 'helper-b');
    const second = captureTaskSelectedSkills(root, taskFile);

    expect(first.task_skill_snapshot.selected_ids).toEqual(['helper-a']);
    expect(first.task_selected_skill_paths).toEqual([firstPath]);
    expect(second.task_skill_snapshot.selected_ids).toEqual(['helper-b']);
    expect(second.task_selected_skill_paths).toEqual([secondPath]);
    expect(first.task_skill_snapshot.selected_ids).not.toBe(second.task_skill_snapshot.selected_ids);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.task_skill_snapshot)).toBe(true);
  });

  it('resolves a directory rename by stable metadata.id, not by name or path', async () => {
    const { root, taskFile } = await fixture();
    await fs.writeFile(path.join(root, taskFile), SNAPSHOT(['stable-id']));
    await install(root, 'before-rename', 'stable-id');
    const before = captureTaskSelectedSkills(root, taskFile);

    await fs.rename(
      path.join(root, '.agents', 'skills', 'before-rename'),
      path.join(root, '.agents', 'skills', 'after-rename'),
    );
    const after = captureTaskSelectedSkills(root, taskFile);

    expect(before.task_skill_snapshot.selected_ids).toEqual(['stable-id']);
    expect(after.task_skill_snapshot.selected_ids).toEqual(['stable-id']);
    expect(after.task_selected_skill_paths).toEqual(['.agents/skills/after-rename/SKILL.md']);
  });

  it('warns and omits missing and conflicting IDs while preserving the immutable selection audit', async () => {
    const { root, taskFile } = await fixture();
    await fs.writeFile(path.join(root, taskFile), SNAPSHOT(['missing-id', 'conflict-id', 'available-id']));
    const availablePath = await install(root, 'available', 'available-id');
    await install(root, 'conflict-one', 'conflict-id');
    await install(root, 'conflict-two', 'conflict-id');

    const capture = captureTaskSelectedSkills(root, taskFile);

    expect(capture.task_skill_snapshot.selected_ids).toEqual(['missing-id', 'conflict-id', 'available-id']);
    expect(capture.task_selected_skill_paths).toEqual([availablePath]);
    expect(capture.task_skill_snapshot.warnings).toEqual([
      { id: 'conflict-id', code: 'skill_id_conflict' },
      { id: 'missing-id', code: 'missing_skill' },
    ]);
  });

  it('scans only immediate non-symlink skills and never follows a symlinked entry', async () => {
    const { root, taskFile } = await fixture();
    await fs.writeFile(path.join(root, taskFile), SNAPSHOT(['linked-id', 'real-id']));
    const realPath = await install(root, 'real', 'real-id');
    const target = path.join(root, '.agents', 'skills', 'real');
    await fs.symlink(target, path.join(root, '.agents', 'skills', 'linked'));

    const capture = captureTaskSelectedSkills(root, taskFile);

    expect(capture.task_selected_skill_paths).toEqual([realPath]);
    expect(capture.task_skill_snapshot.warnings).toContainEqual({ id: 'linked-id', code: 'missing_skill' });
  });
});

describe('WU-UT-CLI-01 — task_skill_selection v10 portable contract', () => {
  it('declares the optional-helper snapshot and strict resolution order in the v10 binding', async () => {
    const root = path.resolve(import.meta.dir, '../../../../..');
    const parsed = (await import('../skill/task-flow-normalizer.ts')).parseBindingFile(root);
    const binding = parsed.binding as Record<string, any>;
    const selection = binding.task_skill_selection;

    expect(parsed.frontmatter.version).toBe('16.0.0');
    expect(binding.binding_version).toBe('16.0.0');
    expect(selection).toMatchObject({
      optional: true,
      schema: 'task-skills/v1',
      identity: 'metadata.id',
      resolution: {
        order: ['lane_skill_path', 'surface_skill_paths', 'task_selected_skill_paths'],
        dedupe: 'exact-path-first-wins',
        mandatory_paths_preserved: true,
        executor_resolution: 'injected-paths-only',
        fallback: 'forbidden',
        truncation: 'forbidden',
      },
      cli: {
        create_endpoint: '/projects/:id/tasks/template',
        selection_modes: ['skills', 'no-skills', 'interactive'],
        selection_modes_mutually_exclusive: true,
        interactive_requires_tty: true,
        interactive_forbidden_with_json: true,
        create_without_selection_mode: 'defaults',
        update_without_selection_mode: 'preserve',
      },
    });
  });
});

describe('WU-UT-COORD-01 — mandatory aggregate ordering and guardrails', () => {
  it('orders lane → surfaces → helpers and keeps first exact path occurrence', async () => {
    const { root } = await fixture();
    const lanePath = await install(root, 'lane', 'lane-id');
    const surfacePath = await install(root, 'surface', 'surface-id');
    const helperPath = await install(root, 'helper', 'helper-id');
    await installMap(root, [{ id: 'apply', modulo: lanePath, proposito: 'test lane' }]);

    const context = resolveLaneSkillContext(root, { criteria_identity: { schema: 'canonical-criteria/v1', surface_skill_paths: [surfacePath], approval_evidence: 'approval', planning_evidence: 'planning', close_evidence: 'close' }, lanes: { apply: { skill: 'lane-skill' } } }, 'apply', {
      surfaceSkillPaths: [surfacePath, lanePath, surfacePath],
      helperSkillPaths: [helperPath, surfacePath],
      taskSkillCapture: {
        task_skill_snapshot: { schema: 'task-skills/v1', selected_ids: [], warnings: [] },
        task_selected_skill_paths: [helperPath],
      },
    });

    expect(context.surface_skill_paths).toEqual([surfacePath]);
    expect(context.skill_paths).toEqual([lanePath, surfacePath, helperPath]);
  });

  it('treats empty and invalid captures as zero helpers without changing guardrails', async () => {
    const { root } = await fixture();
    const lanePath = await install(root, 'lane', 'lane-id');
    const surfacePath = await install(root, 'surface', 'surface-id');
    await installMap(root, [{ id: 'apply', modulo: lanePath, proposito: 'test lane' }]);

    const context = resolveLaneSkillContext(root, { criteria_identity: { schema: 'canonical-criteria/v1', surface_skill_paths: [surfacePath], approval_evidence: 'approval', planning_evidence: 'planning', close_evidence: 'close' }, lanes: { apply: { skill: 'lane-skill' } } }, 'apply', {
      surfaceSkillPaths: [surfacePath],
      taskSkillCapture: {
        task_skill_snapshot: { schema: 'task-skills/v1', selected_ids: [], warnings: [{ code: 'snapshot_parse_error' }] },
        task_selected_skill_paths: [],
      },
    });

    expect(context.lane_skill_path).toBe(lanePath);
    expect(context.surface_skill_paths).toEqual([surfacePath]);
    expect(context.skill_paths).toEqual([lanePath, surfacePath]);
  });
});
