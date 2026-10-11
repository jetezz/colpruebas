import { z } from 'zod';
import {
  CriteriaMapDocumentSchema, NavigationDocumentSchema, PhaseDefinitionSchema,
  StateDefinitionSchema, TaskDocumentSchema, TestViewDocumentSchema,
} from '../contracts/index.ts';

export const DOCUMENT_SCHEMAS = {
  navigation: NavigationDocumentSchema,
  'test-view': TestViewDocumentSchema,
  'criteria-map': CriteriaMapDocumentSchema,
  task: TaskDocumentSchema,
  'phase-definition': PhaseDefinitionSchema,
  'state-definition': StateDefinitionSchema,
} as const;
export const SCHEMA_FILES = {
  navigation: 'navigation.schema.json',
  'test-view': 'test-view.schema.json',
  'criteria-map': 'criteria-map.schema.json',
  task: 'task.schema.json',
  'phase-definition': 'phase-definition.schema.json',
  'state-definition': 'state-definition.schema.json',
} as const;
export type SchemaName = keyof typeof DOCUMENT_SCHEMAS;
export type SchemaIssue = { path: string; message: string };
export type ValidatedDocument<N extends SchemaName> = z.infer<(typeof DOCUMENT_SCHEMAS)[N]>;
export type SchemaValidation<N extends SchemaName> =
  | { valid: true; name: N; data: ValidatedDocument<N>; issues: [] }
  | { valid: false; name: N; issues: SchemaIssue[] };

function normalizeIssues(error: z.ZodError): SchemaIssue[] {
  return error.issues.map(issue => ({
    path: issue.path.reduce<string>((path, part) => typeof part === 'number' ? `${path}[${part}]` : `${path}.${String(part)}`, '$'),
    message: issue.message,
  }));
}

export function validateSchemaData(name: SchemaName, data: unknown): SchemaIssue[] {
  const result = DOCUMENT_SCHEMAS[name].safeParse(data);
  return result.success ? [] : normalizeIssues(result.error);
}

/** Validate unknown input; the successful discriminated branch carries the inferred contract type. */
export function validateDocument<N extends SchemaName>(name: N, data: unknown): SchemaValidation<N> {
  const result = DOCUMENT_SCHEMAS[name].safeParse(data);
  if (!result.success) return { valid: false, name, issues: normalizeIssues(result.error) };
  return { valid: true, name, data: result.data as ValidatedDocument<N>, issues: [] };
}
