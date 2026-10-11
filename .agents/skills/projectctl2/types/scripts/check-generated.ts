#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { z } from 'zod';
import { uniqueStringArray } from '../contracts/shared.ts';
import { renderJsonSchemas } from './generate-schemas.ts';
import { DOCUMENT_SCHEMAS, SCHEMA_FILES, validateDocument } from './schema-validator.ts';

const stale: string[] = [];
for (const [file, expected] of renderJsonSchemas()) {
  try { if (readFileSync(file, 'utf8') !== expected) stale.push(file); }
  catch { stale.push(file); }
}
if (stale.length) {
  console.error('Generated JSON Schemas are stale; run bun .agents/skills/projectctl2/types/scripts/generate-schemas.ts');
  for (const file of stale) console.error(`- ${file}`);
  process.exitCode = 1;
} else console.log('Generated Draft 2020-12 JSON Schemas are up to date.');

const ajv = new Ajv2020({ allErrors: true, strict: true });
const jsonSchemas = new Map<string, object>();
for (const file of renderJsonSchemas().keys()) jsonSchemas.set(file, JSON.parse(readFileSync(file, 'utf8')) as object);
const navigationFile = join(import.meta.dir, '../generated', SCHEMA_FILES.navigation);
const navigationSchema = jsonSchemas.get(navigationFile)! as { $id?: string };
if (navigationSchema.$id !== DOCUMENT_SCHEMAS.navigation.meta()?.id) {
  console.error('Generated navigation schema is missing its canonical $id.');
  process.exitCode = 1;
}
const ajvValidators = new Map<string, ReturnType<typeof ajv.compile>>();
for (const [file, schema] of jsonSchemas) {
  try { ajvValidators.set(basename(file), ajv.compile(schema)); }
  catch (error) {
    console.error(`Ajv rejected generated Draft 2020-12 schema ${file}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

const validTask = {
  task_id: '20261010-abcd', task_slug: 'sample-task', task_name: 'Sample', current_problem: 'Problem',
  ui_url: '', skills: ['skill-one'], app_map: '', expected: '',
  criteria: [{ operation: 'new', criterion: { id: 'AC-1', description: 'Criterion', type: 'frontend' } }], source_branch: 'develop',
  branch: '', pr: '', phase: 'fase_1_propuesta', state: 'p1_started', proposal_state: 'not-init', functional_state: 'not-init', requirements_fix: false,
};
const duplicateSkills = validateDocument('task', { ...validTask, skills: ['same', 'same'] });
const malformedId = validateDocument('task', { ...validTask, task_id: 'bad' });
const unknownField = validateDocument('navigation', { schema_version: 1, views: [], surprise: true });
const duplicatePhaseStates = validateDocument('phase-definition', { id: 'fase_1_propuesta', states: ['p1_started', 'p1_started'] });
if (validateDocument('task', validTask).valid !== true || duplicateSkills.valid || malformedId.valid || unknownField.valid || duplicatePhaseStates.valid) {
  console.error('Zod contract checks failed: expected valid task and rejection of duplicates, malformed patterns, and unknown keys.');
  process.exitCode = 1;
}

// Uniqueness metadata belongs to the array declaration and is independent of its property name.
const generatedTask = JSON.parse(readFileSync(resolve(import.meta.dir, `../generated/${SCHEMA_FILES.task}`), 'utf8')) as any;
const generatedPhase = JSON.parse(readFileSync(resolve(import.meta.dir, `../generated/${SCHEMA_FILES['phase-definition']}`), 'utf8')) as any;
const taskId = DOCUMENT_SCHEMAS.task.meta()?.id as string;
const phaseDefinitionId = DOCUMENT_SCHEMAS['phase-definition'].meta()?.id as string;
const taskSkillsSchema = generatedTask.$defs[taskId].properties.skills;
const phaseStatesSchema = generatedPhase.$defs[phaseDefinitionId].oneOf[0].properties.states;
const arbitraryNameSchema = z.strictObject({ arbitrary: uniqueStringArray(z.string()), skills: z.array(z.string()) });
const arbitraryNames = z.toJSONSchema(arbitraryNameSchema, { target: 'draft-2020-12', io: 'input' }) as any;
const arbitraryAjv = ajv.compile(arbitraryNames);
if (taskSkillsSchema.uniqueItems !== true || phaseStatesSchema.uniqueItems !== true ||
    arbitraryNames.properties.arbitrary.uniqueItems !== true || arbitraryNames.properties.skills.uniqueItems !== undefined ||
    arbitraryAjv({ arbitrary: ['x', 'x'], skills: [] }) ||
    arbitraryNameSchema.safeParse({ arbitrary: ['x', 'x'], skills: [] }).success) {
  console.error('Generated schemas must export declaration-owned uniqueness, independent of property names.');
  process.exitCode = 1;
}
const taskAjv = ajvValidators.get(SCHEMA_FILES.task)!;
const phaseAjv = ajvValidators.get(SCHEMA_FILES['phase-definition'])!;
if (!taskAjv(validTask) || taskAjv({ ...validTask, skills: ['same', 'same'] }) ||
    taskAjv({ ...validTask, task_id: 'bad' }) || taskAjv({ ...validTask, unknown: true }) ||
    taskAjv({ ...validTask, criteria: [{ operation: 'new', criterion: { id: 'AC-1', description: 'Criterion', type: 'frontend', extra: true } }] }) ||
    !phaseAjv({ id: 'fase_1_propuesta', states: ['p1_started'] }) ||
    phaseAjv({ id: 'fase_1_propuesta', states: ['p1_started', 'p1_started'] })) {
  console.error('Ajv behavior checks failed for exported schemas (valid task, uniqueness, patterns, strict keys, or phase states).');
  process.exitCode = 1;
}
