#!/usr/bin/env bun
import { cli, readTaskDocument, updateTaskFields } from './task-file.ts';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import type { TaskAppMapTargetSchema, TaskCriterionOperationSchema, TaskDocument } from '../../../types/contracts/index.ts';
import type { z } from 'zod';

// Canonical origin: TaskAppMapTargetSchema / TaskCriterionOperationSchema in
// types/contracts/task.ts (imported type-only). The schema enforced by
// validateDocument('task') below remains the validator — these aliases only
// document origin; logic is unchanged.
type TaskAppMapTarget = z.infer<typeof TaskAppMapTargetSchema>;
type TaskCriterionOperation = z.infer<typeof TaskCriterionOperationSchema>;

const allowedFields = new Set<keyof TaskDocument>(['skills', 'app_map', 'expected', 'criteria', 'proposal_state', 'functional_state', 'requirements_fix', 'pr', 'ui_url']);
type Patch = Partial<Pick<TaskDocument, 'skills' | 'app_map' | 'expected' | 'criteria' | 'proposal_state' | 'functional_state' | 'requirements_fix' | 'pr' | 'ui_url'>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validatePatch(value: unknown, current: TaskDocument): asserts value is Patch {
  if (!isRecord(value)) throw new Error('patch must be a JSON object');
  const fields = Object.keys(value);
  if (!fields.length) throw new Error('patch must update at least one field');
  const unknown = fields.filter(field => !allowedFields.has(field as keyof TaskDocument));
  if (unknown.length) throw new Error(`fields cannot be updated here: ${unknown.join(', ')}`);

  // Canonical type: TaskDocument['skills'] (uniqueStringArray in types/contracts/shared.ts).
  // Trim pre-normalizes; validateDocument('task') below enforces NonEmptyText + uniqueItems.
  if (Array.isArray(value.skills)) {
    const skills = value.skills as Array<TaskDocument['skills'][number] | unknown>;
    value.skills = skills.map(skill => typeof skill === 'string' ? skill.trim() : skill);
  }

  const result = validateDocument('task', { ...current, ...value });
  if (!result.valid) {
    throw new Error(`task update is invalid: ${result.issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
  }

  const seenIds = new Set<string>();
  // Canonical types below; app_map/criteria correspondence stays a semantic check
  // on schema-validated data (validateDocument above), not a second validator.
  const appMap: TaskAppMapTarget = result.data.app_map;
  const viewId = appMap === '' ? undefined : appMap.view.id;
  for (const [index, operation] of result.data.criteria.entries()) {
    const criterionOp: TaskCriterionOperation = operation;
    const id = criterionOp.operation === 'delete' ? criterionOp.id : criterionOp.criterion.id;
    if (id === viewId) throw new Error(`criteria[${index}] id collides with app_map.view.id`);
    if (seenIds.has(id)) throw new Error(`duplicate criterion id in update: ${id}`);
    seenIds.add(id);
  }
}

function main(argv: string[]): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write('usage: bun update-task.ts <task-index> <patch-json>\n');
    return;
  }
  if (argv.length !== 2) throw new Error('usage: bun update-task.ts <task-index> <patch-json>');
  const [taskFile, rawPatch] = argv as [string, string];
  let patch: unknown;
  try { patch = JSON.parse(rawPatch); }
  catch { throw new Error('patch-json is not valid JSON'); }

  const current = readTaskDocument(taskFile);
  validatePatch(patch, current);
  updateTaskFields(taskFile, patch);
  process.stdout.write(`${JSON.stringify(Object.keys(patch))}\n`);
}

cli(() => main(process.argv.slice(2)));
