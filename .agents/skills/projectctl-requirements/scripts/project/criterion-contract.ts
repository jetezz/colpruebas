/** Canonical criterion identity. Pure core contract; no SDD or instance dependency. */
import { createHash } from 'node:crypto';

export const CRITERION_ID_PATTERN = '^[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-\\d+[A-Z]?$';
export const CRITERION_TYPES = Object.freeze(['ui', 'functionality', 'a11y', 'backend', 'data', 'integration', 'security', 'performance', 'tooling'] as const);
export type CriterionDefinition = { id: string; title: string; type: typeof CRITERION_TYPES[number]; requirement?: string };

export function isCriterionId(value: unknown): value is string {
  return typeof value === 'string' && new RegExp(CRITERION_ID_PATTERN).test(value);
}

/** Case normalization is lexical only: never translates prefixes, numbers or aliases. */
export function collectCriterionIds(text: string): string[] {
  return [...new Set([...text.matchAll(criterionIdExpression())].map(m => m[1]!.toUpperCase()))];
}

export function criterionIdExpression(): RegExp {
  return new RegExp(`\\b(${CRITERION_ID_PATTERN.slice(1, -1)})\\b`, 'gi');
}

export function criterionDefinition(value: Record<string, unknown>): CriterionDefinition {
  if (!isCriterionId(value.id) || typeof value.title !== 'string' || !value.title.trim()
      || !CRITERION_TYPES.includes(value.type as CriterionDefinition['type'])
      || (value.requirement !== undefined && (typeof value.requirement !== 'string' || !value.requirement.trim()))) {
    throw new Error('invalid canonical criterion definition');
  }
  return { id: value.id, title: value.title, type: value.type as CriterionDefinition['type'],
    ...(typeof value.requirement === 'string' ? { requirement: value.requirement } : {}) };
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** Revision of the acceptance definition, not of run results/coverage/implementation status. */
export function criterionRevision(value: Record<string, unknown>): string {
  return createHash('sha256').update(canonicalJson(criterionDefinition(value))).digest('hex');
}

/** A retained tombstone reserves the ID permanently without claiming implementation/coverage. */
export function isRetiredCriterion(value: Record<string, unknown>): boolean {
  return value.functional === 'not-applicable' && value.exception_reason === 'criterion_retired';
}
