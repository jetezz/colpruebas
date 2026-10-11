#!/usr/bin/env bun
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { NavigationCriterionSchema } from '../contracts/index.ts';
import { DOCUMENT_SCHEMAS, SCHEMA_FILES, type SchemaName } from './schema-validator.ts';

/** Single-source contract registry (canonical definition lives in schema-validator.ts). */
export const CONTRACT_SCHEMAS = DOCUMENT_SCHEMAS;
export type ContractName = SchemaName;

function contractId(name: SchemaName): string {
  const id = DOCUMENT_SCHEMAS[name].meta()?.id;
  if (typeof id !== 'string' || !id) throw new Error(`Contract ${name} is missing its canonical meta().id.`);
  return id;
}

export function renderJsonSchemas(): Map<string, string> {
  const outputs = new Map<string, string>();
  const navigationCriterion = z.toJSONSchema(NavigationCriterionSchema, { target: 'draft-2020-12', io: 'input' });
  const navigationId = contractId('navigation');
  const taskId = contractId('task');
  for (const name of Object.keys(DOCUMENT_SCHEMAS) as SchemaName[]) {
    const schema = DOCUMENT_SCHEMAS[name];
    const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12', io: 'input' }) as Record<string, any>;
    jsonSchema.$id = contractId(name);
    if (name === 'navigation') {
      jsonSchema.$defs ??= {};
      jsonSchema.$defs.criterion = navigationCriterion;
    }
    if (name === 'task') {
      const taskDefinition = jsonSchema.$defs?.[taskId];
      const operations = taskDefinition?.properties?.criteria?.items?.oneOf;
      if (!Array.isArray(operations)) throw new Error('Task criterion operation union was not emitted as oneOf.');
      for (const operation of operations) {
        if (operation.properties?.criterion) operation.properties.criterion = {
          $ref: `${navigationId}#/$defs/criterion`,
        };
      }
    }
    outputs.set(join(import.meta.dir, '../generated', SCHEMA_FILES[name]), `${JSON.stringify(jsonSchema, null, 2)}\n`);
  }
  return outputs;
}

if (import.meta.main) {
  mkdirSync(join(import.meta.dir, '../generated'), { recursive: true });
  for (const [path, contents] of renderJsonSchemas()) writeFileSync(path, contents);
  console.log(`Generated ${Object.keys(CONTRACT_SCHEMAS).length} Draft 2020-12 JSON Schemas.`);
}
