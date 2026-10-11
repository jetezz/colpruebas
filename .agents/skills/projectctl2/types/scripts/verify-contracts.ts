#!/usr/bin/env bun
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import { renderJsonSchemas } from './generate-schemas.ts';
import { renderContractDocs } from './generate-contract-docs.ts';
import { SCHEMA_FILES, DOCUMENT_SCHEMAS, validateDocument } from './schema-validator.ts';
import { valid, invalid } from './__tests__/fixtures.ts';
import { WorkflowCatalog } from '../contracts/workflow.ts';

const scriptsDir = import.meta.dir;
const skillDir = resolve(scriptsDir, '../../');
const generatedDir = resolve(scriptsDir, '../generated');
const docsPath = resolve(skillDir, 'requirements/contracts.md');
const fixtureDir = resolve(process.env.PROJECTCTL2_CONTRACT_FIXTURE_DIR ?? resolve(scriptsDir, '__tests__/fixtures/data'));
let failures = 0;
function fail(message: string) { console.error(`FAIL ${message}`); failures++; }

function requireFixture(file: string): boolean {
  try {
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error('not a regular file');
    readFileSync(file, 'utf8');
    return true;
  } catch (error) {
    fail(`fixture is missing or unreadable: ${file} (${error instanceof Error ? error.message : String(error)})`);
    return false;
  }
}

for (const [file, expected] of renderJsonSchemas()) {
  try { if (readFileSync(file, 'utf8') !== expected) fail(`stale generated schema: ${file}`); }
  catch { fail(`missing generated schema: ${file}`); }
}
try {
  if (readFileSync(docsPath, 'utf8') !== renderContractDocs()) fail(`stale contract Markdown: ${docsPath}`);
} catch { fail(`missing contract Markdown: ${docsPath}`); }

const schemas = Object.fromEntries(Object.entries(SCHEMA_FILES).map(([name, file]) => {
  try { return [name, JSON.parse(readFileSync(resolve(generatedDir, file), 'utf8')) as Record<string, any>]; }
  catch { fail(`missing or invalid JSON schema: ${file}`); return [name, {}]; }
})) as Record<keyof typeof SCHEMA_FILES, Record<string, any>>;
const ajv = new Ajv2020({ allErrors: true, strict: true });
try {
  const navigation = schemas.navigation;
  if (navigation.$id !== DOCUMENT_SCHEMAS.navigation.meta()?.id) fail('navigation schema has no canonical $id');
  ajv.addSchema(navigation);
  const validators = new Map<string, ReturnType<typeof ajv.compile>>();
  for (const [name, schema] of Object.entries(schemas)) {
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') fail(`${name} is not declared Draft 2020-12`);
    if (!schema.$id) fail(`${name} schema is missing $id`);
    if (name !== 'navigation') validators.set(name, ajv.compile(schema));
  }
  // This compiles the task's external canonical Navigation criterion reference through Ajv's URI registry.
  const task = validators.get('task') ?? ajv.compile(schemas.task);
  validators.set('task', task);
  for (const name of Object.keys(SCHEMA_FILES) as (keyof typeof SCHEMA_FILES)[]) {
    const ajvValidator = name === 'navigation' ? ajv.getSchema(schemas.navigation.$id) : validators.get(name);
    if (!ajvValidator) { fail(`Ajv did not compile ${name}`); continue; }
    const runtimeValid = validateDocument(name, valid[name]).valid;
    const runtimeInvalid = validateDocument(name, invalid[name]).valid;
    if (!runtimeValid || runtimeInvalid) fail(`${name}: representative Zod runtime fixtures did not match expected results`);
    if (ajvValidator(valid[name]) !== runtimeValid || ajvValidator(invalid[name]) !== runtimeInvalid) fail(`${name}: Zod and Ajv behavior differs`);
  }
} catch (error) { fail(`Draft 2020-12/Ajv validation failed: ${error instanceof Error ? error.message : String(error)}`); }

const tests = Bun.spawnSync(['bun', 'test', resolve(scriptsDir, '__tests__/contracts.test.ts')], {
  cwd: process.cwd(), stdout: 'inherit', stderr: 'inherit',
});
if (tests.exitCode !== 0) fail(`contract unit tests exited with ${tests.exitCode ?? 'a signal'}`);

const typeTests = Bun.spawnSync([
  'bun', resolve(process.cwd(), 'node_modules/typescript/bin/tsc'), '-p', resolve(scriptsDir, '../tsconfig.verify.json'),
], { cwd: process.cwd(), stdout: 'inherit', stderr: 'inherit' });
if (typeTests.exitCode !== 0) fail(`contract/script type checks exited with ${typeTests.exitCode ?? 'a signal'}`);

// Parse persistent YAML/frontmatter fixtures through the public CLI, not only Zod objects.
/**
 * YAML fixture stems checked through the validate-data CLI.
 * `workflow` is a legacy fixture-stem alias for the `phase-definition` schema
 * (fixtures `workflow.yaml` / `workflow.invalid.yaml` validate as `phase-definition`).
 */
const yamlFixtureCases = [
  { fixture: 'navigation', schema: 'navigation' },
  { fixture: 'test-view', schema: 'test-view' },
  { fixture: 'criteria-map', schema: 'criteria-map' },
  { fixture: 'workflow', schema: 'phase-definition' },
] as const satisfies readonly { fixture: string; schema: keyof typeof SCHEMA_FILES }[];
const cli = resolve(scriptsDir, 'validate-data.ts');
for (const { fixture: name, schema } of yamlFixtureCases) {
  const validFile = resolve(fixtureDir, `${name}.yaml`);
  const invalidFile = resolve(fixtureDir, `${name}.invalid.yaml`);
  if (requireFixture(validFile)) {
    const good = Bun.spawnSync(['bun', cli, '--schema', schema, '--file', validFile], { cwd: process.cwd(), stdout: 'inherit', stderr: 'inherit' });
    if (good.exitCode !== 0) fail(`${name} YAML fixture rejected by validate-data CLI`);
  }
  if (requireFixture(invalidFile)) {
    const bad = Bun.spawnSync(['bun', cli, '--schema', schema, '--file', invalidFile], { cwd: process.cwd(), stdout: 'pipe', stderr: 'pipe' });
    const diagnostic = `${bad.stdout?.toString() ?? ''}\n${bad.stderr?.toString() ?? ''}`;
    if (bad.exitCode === 0) fail(`${name} negative YAML fixture accepted by validate-data CLI`);
    if (!diagnostic.includes(`${invalidFile}: invalid ${schema} document`) || !/^\s*- .+$/m.test(diagnostic)) {
      fail(`${name} negative YAML fixture did not report a schema issue for its expected document`);
    }
  }
}
for (const [file, expected] of [['task.md', 0], ['task.invalid.md', 1]] as const) {
  const taskFile = resolve(fixtureDir, file);
  if (!requireFixture(taskFile)) continue;
  const result = Bun.spawnSync(['bun', cli, '--schema', 'task', '--file', taskFile], { cwd: process.cwd(), stdout: expected ? 'pipe' : 'inherit', stderr: expected ? 'pipe' : 'inherit' });
  if (!expected && result.exitCode !== 0) fail(`${file} frontmatter CLI result was unexpected`);
  if (expected) {
    const diagnostic = `${result.stdout?.toString() ?? ''}\n${result.stderr?.toString() ?? ''}`;
    if (result.exitCode === 0) fail(`${file} frontmatter negative fixture accepted by validate-data CLI`);
    if (!diagnostic.includes(`${taskFile}: invalid task document`) || !/^\s*- .+$/m.test(diagnostic)) {
      fail(`${file} frontmatter negative fixture did not report a task schema issue`);
    }
  }
}

const phaseDoc = readFileSync(process.env.PROJECTCTL2_PHASE_DOC ?? resolve(skillDir, 'sdd/phases/SKILL.md'), 'utf8');
const documentedWorkflow: Record<string, string[]> = {};
const phaseHeadings = [...phaseDoc.matchAll(/^## (?:Fase|Phase) \d+ — `([^`]+)`\s*$/gm)];
for (const heading of phaseHeadings) {
  const phaseId = heading[1]!;
  if (Object.hasOwn(documentedWorkflow, phaseId)) fail(`duplicate phase declaration in sdd/phases/SKILL.md: ${phaseId}`);
  const start = heading.index! + heading[0].length;
  const nextHeading = phaseDoc.slice(start).search(/^#{1,6}\s/m);
  const section = phaseDoc.slice(start, nextHeading < 0 ? undefined : start + nextHeading);
  documentedWorkflow[phaseId] = [...section.matchAll(/^- \*\*`([^`]+)`\*\*:/gm)].map(match => match[1]!);
}
const catalogWorkflow = WorkflowCatalog as Record<string, readonly string[]>;
const documentedPhaseIds = Object.keys(documentedWorkflow);
const catalogPhaseIds = Object.keys(catalogWorkflow);
if (JSON.stringify(documentedPhaseIds) !== JSON.stringify(catalogPhaseIds)) fail('phase identifiers in sdd/phases/SKILL.md do not exactly match WorkflowCatalog (including order)');
for (const phaseId of new Set([...documentedPhaseIds, ...catalogPhaseIds])) {
  const documentedStates = documentedWorkflow[phaseId];
  const catalogStates = catalogWorkflow[phaseId];
  if (!documentedStates || !catalogStates || JSON.stringify(documentedStates) !== JSON.stringify(catalogStates)) {
    fail(`state identifiers declared under phase ${phaseId} in sdd/phases/SKILL.md do not exactly match WorkflowCatalog (including order, uniqueness, and phase assignment)`);
  }
}

if (failures) {
  console.error(`Contract verification failed (${failures} finding${failures === 1 ? '' : 's'}).`);
  process.exitCode = 1;
} else {
  console.log('Contract schemas, Markdown, canonical references, and runtime/Ajv fixtures are consistent.');
}
