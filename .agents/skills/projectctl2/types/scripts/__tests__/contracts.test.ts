import { describe, expect, test } from 'bun:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { z } from 'zod';
import { uniqueStringArray } from '../../contracts/shared.ts';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateDocument, type SchemaName } from '../schema-validator.ts';
import { SCHEMA_FILES } from '../schema-validator.ts';
import { renderContractDocs } from '../generate-contract-docs.ts';
import { valid, invalid } from './fixtures.ts';

const generated = resolve(import.meta.dir, '../../generated');
const schemas = Object.fromEntries(Object.entries(SCHEMA_FILES).map(([name, file]) => [name, JSON.parse(readFileSync(resolve(generated, file), 'utf8'))]));
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addSchema(schemas.navigation);

describe('shared data contracts', () => {
  test('contract reference renders all six top-level summaries', () => {
    const docs = renderContractDocs();
    for (const summary of [
      'Canonical view-feature-criterion hierarchy parsed from docs/app-map/navigation.yaml.',
      'Test-type and test-status records for one view, parsed from its App Map YAML file.',
      'A per-type projection of navigation criteria with project-relative implementation paths.',
      'Complete Task SDD frontmatter document. App Map correspondence and phase-transition rules remain semantic checks.',
    ]) expect(docs).toContain(summary);
    expect(docs).toContain('State definition for workflow phase fase_1_propuesta.');
    expect(docs).toContain('State selection for workflow phase fase_1_propuesta.');
  });

  for (const name of Object.keys(SCHEMA_FILES) as SchemaName[]) {
    test(`${name}: representative valid and invalid inputs agree at runtime and Ajv`, () => {
      const validator = name === 'navigation' ? ajv.getSchema(schemas[name].$id) : ajv.compile(schemas[name]);
      expect(validateDocument(name, valid[name]).valid).toBe(true);
      expect(validateDocument(name, invalid[name]).valid).toBe(false);
      expect(validator?.(valid[name])).toBe(true);
      expect(validator?.(invalid[name])).toBe(false);
    });
  }

  test('strict objects reject unknown root and nested criterion fields', () => {
    expect(validateDocument('navigation', { ...valid.navigation, extra: true }).valid).toBe(false);
    expect(validateDocument('navigation', { schema_version: 1, views: [{ ...valid.navigation.views[0], extra: true }] }).valid).toBe(false);
    expect(validateDocument('task', { ...valid.task, criteria: [{ operation: 'new', criterion: { id: 'x', description: 'x', type: 'frontend', extra: true } }] }).valid).toBe(false);
  });

  test('task operation union accepts all declared operations and rejects unknown discriminants', () => {
    for (const operation of [
      { operation: 'new', criterion: { id: 'AC-1', description: 'Add', type: 'frontend' } },
      { operation: 'edit', criterion: { id: 'AC-1', description: 'Edit', type: 'frontend' } },
      { operation: 'delete', id: 'AC-1' },
    ]) expect(validateDocument('task', { ...valid.task, criteria: [operation] }).valid).toBe(true);
    expect(validateDocument('task', { ...valid.task, criteria: [{ operation: 'rename', id: 'AC-1' }] }).valid).toBe(false);
  });

  test('phase and state identifiers remain related', () => {
    expect(validateDocument('phase-definition', { id: 'fase_1_propuesta', states: ['p2_planning'] }).valid).toBe(false);
    expect(validateDocument('state-definition', { phase: 'fase_1_propuesta', state: 'p2_planning' }).valid).toBe(false);
  });

  test('task requirements_fix defaults to false and rejects non-booleans', () => {
    const { requirements_fix: _omitted, ...withoutFix } = valid.task;
    const defaulted = validateDocument('task', withoutFix);
    expect(defaulted.valid).toBe(true);
    if (defaulted.valid) expect(defaulted.data.requirements_fix).toBe(false);
    expect(validateDocument('task', { ...valid.task, requirements_fix: 42 }).valid).toBe(false);
    expect(validateDocument('task', { ...valid.task, requirements_fix: 'true' }).valid).toBe(false);
  });

  test('state-definition accepts requirements states in their own phase and rejects cross-phase', () => {
    expect(validateDocument('state-definition', { phase: 'fase_3_verificacion', state: 'p3_requirements' }).valid).toBe(true);
    expect(validateDocument('state-definition', { phase: 'fase_3_verificacion', state: 'p4_requirements_docs' }).valid).toBe(false);
    expect(validateDocument('state-definition', { phase: 'fase_4_documentacion', state: 'p4_requirements_docs' }).valid).toBe(true);
  });

  test('unique arrays reject duplicate task skills and phase states in both validators', () => {
    const task = ajv.compile(schemas.task);
    const phase = ajv.compile(schemas['phase-definition']);
    expect(validateDocument('task', { ...valid.task, skills: ['sdd', 'sdd'] }).valid).toBe(false);
    expect(task({ ...valid.task, skills: ['sdd', 'sdd'] })).toBe(false);
    expect(phase(invalid['phase-definition'])).toBe(false);
  });

  test('unique string helper runtime behavior matches JSON Schema uniqueItems in Ajv', () => {
    const schema = uniqueStringArray(z.string());
    const ajvValidator = ajv.compile(z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' }));
    const duplicateStrings = ['same', 'same'];
    expect(schema.safeParse(duplicateStrings).success).toBe(false);
    expect(ajvValidator(duplicateStrings)).toBe(false);
    expect(schema.safeParse(['first', 'second']).success).toBe(true);
    expect(ajvValidator(['first', 'second'])).toBe(true);
  });
});
