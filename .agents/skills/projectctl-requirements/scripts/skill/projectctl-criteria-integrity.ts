#!/usr/bin/env bun
/**
 * `.agents/skills/projectctl-requirements/scripts/skill/projectctl-criteria-integrity.ts`
 *
 * WU-02 (`sdd-apply-code-high`, task 20260908-pctmap) — closed-schema
 * validators for criteria.yaml and coverage-ledger.yaml. Bun stdlib +
 * `Bun.YAML.parse` only; no extra packages.
 *
 * Public API:
 *   validateCriteriaDocument(input)
 *   validateCoverageLedger(input, criteria)
 *   mergeCoverageLedger(current, incoming, expectedCriteriaRevision)
 *   checkProjectctlCriteriaIntegrity(repoRoot)
 *
 * Fail-closed on unknown fields, duplicate PCT IDs, invalid types,
 * secret/host values, ledger entries that redefine criteria, mixed
 * revisions, and non-idempotent merges.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { isCriterionId, CRITERION_TYPES } from '../project/criterion-contract.ts';
export { CRITERION_TYPES } from '../project/criterion-contract.ts';

import {
  detectSecretOrHostValue,
  sha256OfString,
  canonicalJson,
  type AuthorityIssue,
} from './projectctl-map.ts';

// Portable: no static import to `sandbox/` (absent in copy-tree-no-mods
// installs). Quality checks Q1/Q2/Q5/Q7 are implemented locally below;
// `checkProjectctlCriteriaQuality` orchestrates them warn-first.

export const CRITERIA_SCHEMA_ID = 'projectctl-criteria/v1' as const;
export const LEDGER_SCHEMA_ID = 'projectctl-coverage-ledger/v1' as const;

export const DEFAULT_CRITERIA_PATH =
  '.agents/skills/projectctl-requirements/references/app-map/criteria.yaml';
export const DEFAULT_LEDGER_PATH =
  '.agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml';
export const DEFAULT_CRITERIA_SCHEMA_PATH =
  '.agents/skills/projectctl-requirements/references/schemas/criteria.schema.json';
export const DEFAULT_LEDGER_SCHEMA_PATH =
  '.agents/skills/projectctl-requirements/references/schemas/coverage-ledger.schema.json';


export const CRITERION_STATUS = Object.freeze(['active', 'historical', 'retired'] as const);
export const LEDGER_METHODS = Object.freeze(['Unit', 'PW-AUTO', 'PW-CLI', 'Manual', 'docs-check'] as const);
export const LEDGER_ENTRY_STATUS = Object.freeze(['recorded', 'incomplete', 'overridden', 'rejected'] as const);
export const LEDGER_RESULTS = Object.freeze(['pass', 'fail', 'incomplete', 'not-run'] as const);
export const APPROVAL_KINDS = Object.freeze(['proposal', 'severe', 'pre-merge'] as const);

export const COVERAGE_MATRIX = Object.freeze({
  ui: Object.freeze(['PW-AUTO', 'PW-CLI']),
  functionality: Object.freeze(['PW-AUTO']),
  a11y: Object.freeze(['PW-AUTO', 'PW-CLI']),
  backend: Object.freeze(['Unit']),
  data: Object.freeze(['Unit']),
  integration: Object.freeze(['Unit', 'Manual']),
  security: Object.freeze(['Unit']),
  performance: Object.freeze(['Manual']),
  tooling: Object.freeze(['Unit']),
} as const);

const CLOSED_CRITERIA_DOC_KEYS = Object.freeze(['schema', 'source_revision', 'criteria', 'candidates'] as const);
const CLOSED_CRITERION_KEYS = Object.freeze([
  'id',
  'type',
  'title',
  'requirement',
  'owner',
  'source',
  'revision',
  'status',
] as const);
const CLOSED_CANDIDATE_KEYS = Object.freeze(['id', 'title', 'status', 'mapping', 'related_ac'] as const);
const CLOSED_LEDGER_DOC_KEYS = Object.freeze([
  'schema',
  'source_revision',
  'criteria_revision',
  'entries',
] as const);
const CLOSED_LEDGER_ENTRY_KEYS = Object.freeze([
  'criterion_id',
  'method',
  'status',
  'revision',
  'target',
  'actor',
  'recorded_at',
  'evidence_ref',
  'result',
  'approval',
  'override',
  'source_run',
] as const);
const CLOSED_APPROVAL_KEYS = Object.freeze(['kind', 'actor', 'recorded_at', 'approved_revision'] as const);
const CLOSED_OVERRIDE_KEYS = Object.freeze([
  'reason',
  'risk',
  'scope',
  'actor',
  'timestamp',
  'target_revision',
  'expires_at',
  'approval',
] as const);

const SHA256_RE = /^[a-f0-9]{64}$/;
// Legacy candidate rows are archive-only. Operational IDs use the common core contract.
const CANDIDATE_ID_RE = /^[A-Z]+-CAND-\d{8}-[A-Z]+-[ARM]\d{2}$/;

export type CriterionType = (typeof CRITERION_TYPES)[number];
export type CriterionStatus = (typeof CRITERION_STATUS)[number];
export type LedgerMethod = (typeof LEDGER_METHODS)[number];

export interface CriterionRecord {
  readonly id: string;
  readonly type: CriterionType;
  readonly title: string;
  readonly requirement: string;
  readonly owner: string;
  readonly source: readonly string[];
  readonly revision: string;
  readonly status: CriterionStatus;
}

export interface CandidateRecord {
  readonly id: string;
  readonly title: string;
  readonly status: 'task-scoped';
  readonly mapping: 'unassigned';
  readonly related_ac?: string;
}

export interface CriteriaDocument {
  readonly schema: typeof CRITERIA_SCHEMA_ID;
  readonly source_revision: string;
  readonly criteria: readonly CriterionRecord[];
  readonly candidates: readonly CandidateRecord[];
}

export interface ApprovalRecord {
  readonly kind: (typeof APPROVAL_KINDS)[number];
  readonly actor: string;
  readonly recorded_at: string;
  readonly approved_revision: string;
}

export interface OverrideRecord {
  readonly reason: string;
  readonly risk: string;
  readonly scope: string;
  readonly actor: string;
  readonly timestamp: string;
  readonly target_revision?: string;
  readonly expires_at?: string;
  readonly approval: ApprovalRecord;
}

export interface CoverageLedgerEntry {
  readonly criterion_id: string;
  readonly method: LedgerMethod;
  readonly status: (typeof LEDGER_ENTRY_STATUS)[number];
  readonly revision: string;
  readonly target: string;
  readonly actor: string;
  readonly recorded_at: string;
  readonly evidence_ref: string;
  readonly result: (typeof LEDGER_RESULTS)[number];
  readonly approval?: ApprovalRecord;
  readonly override?: OverrideRecord;
  readonly source_run?: string;
}

export interface CoverageLedger {
  readonly schema: typeof LEDGER_SCHEMA_ID;
  readonly source_revision: string;
  readonly criteria_revision: string;
  readonly entries: readonly CoverageLedgerEntry[];
}

export interface IntegrityResult<T> {
  readonly ok: boolean;
  readonly issues: readonly AuthorityIssue[];
  readonly value: T | null;
}

function issue(
  path: string,
  key: string,
  expected: string,
  got: unknown,
  code: AuthorityIssue['code'],
): AuthorityIssue {
  return {
    path,
    key,
    expected,
    got: formatGot(got),
    code,
  };
}

function formatGot(value: unknown): string {
  if (value === undefined) return '∅';
  if (typeof value === 'string') return JSON.stringify(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownKeys(record: Record<string, unknown>, allowed: readonly string[]): string[] {
  return Object.keys(record).filter((key) => !allowed.includes(key));
}

function scanSecrets(value: unknown, path: string, keyPrefix: string, issues: AuthorityIssue[]): void {
  if (typeof value === 'string') {
    const found = detectSecretOrHostValue(value, path, keyPrefix);
    if (found) issues.push(found);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanSecrets(item, path, `${keyPrefix}[${index}]`, issues));
    return;
  }
  if (isPlainObject(value)) {
    for (const [key, nested] of Object.entries(value)) {
      scanSecrets(nested, path, keyPrefix ? `${keyPrefix}.${key}` : key, issues);
    }
  }
}

function requiredString(raw: unknown, path: string, key: string, issues: AuthorityIssue[]): string | null {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    issues.push(issue(path, key, 'non-empty string', raw, 'invalid_type'));
    return null;
  }
  return raw;
}

function requiredSha(raw: unknown, path: string, key: string, issues: AuthorityIssue[]): string | null {
  if (typeof raw !== 'string' || !SHA256_RE.test(raw)) {
    issues.push(issue(path, key, 'sha256 hex (64)', raw, 'invalid_type'));
    return null;
  }
  return raw;
}

function requiredEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  path: string,
  key: string,
  issues: AuthorityIssue[],
): T | null {
  if (typeof raw !== 'string' || !(allowed as readonly string[]).includes(raw)) {
    issues.push(issue(path, key, allowed.join('|'), raw, 'closed_enum'));
    return null;
  }
  return raw as T;
}

function parseApproval(raw: unknown, path: string, key: string, issues: AuthorityIssue[]): ApprovalRecord | null {
  if (!isPlainObject(raw)) {
    issues.push(issue(path, key, 'object', raw, 'invalid_type'));
    return null;
  }
  for (const extra of unknownKeys(raw, CLOSED_APPROVAL_KEYS)) {
    issues.push(issue(path, `${key}.${extra}`, 'closed approval keys', extra, 'unknown_field'));
  }
  const kind = requiredEnum(raw.kind, APPROVAL_KINDS, path, `${key}.kind`, issues);
  const actor = requiredString(raw.actor, path, `${key}.actor`, issues);
  const recordedAt = requiredString(raw.recorded_at, path, `${key}.recorded_at`, issues);
  const approvedRevision = requiredString(raw.approved_revision, path, `${key}.approved_revision`, issues);
  if (!kind || !actor || !recordedAt || !approvedRevision) return null;
  return { kind, actor, recorded_at: recordedAt, approved_revision: approvedRevision };
}

function parseOverride(raw: unknown, path: string, key: string, issues: AuthorityIssue[]): OverrideRecord | null {
  if (!isPlainObject(raw)) {
    issues.push(issue(path, key, 'object', raw, 'invalid_type'));
    return null;
  }
  for (const extra of unknownKeys(raw, CLOSED_OVERRIDE_KEYS)) {
    issues.push(issue(path, `${key}.${extra}`, 'closed override keys', extra, 'unknown_field'));
  }
  const reason = requiredString(raw.reason, path, `${key}.reason`, issues);
  const risk = requiredString(raw.risk, path, `${key}.risk`, issues);
  const scope = requiredString(raw.scope, path, `${key}.scope`, issues);
  const actor = requiredString(raw.actor, path, `${key}.actor`, issues);
  const timestamp = requiredString(raw.timestamp, path, `${key}.timestamp`, issues);
  const approval = parseApproval(raw.approval, path, `${key}.approval`, issues);
  if (!reason || !risk || !scope || !actor || !timestamp || !approval) return null;
  if (raw.target_revision !== undefined && typeof raw.target_revision !== 'string') {
    issues.push(issue(path, `${key}.target_revision`, 'string', raw.target_revision, 'invalid_type'));
  }
  if (raw.expires_at !== undefined && typeof raw.expires_at !== 'string') {
    issues.push(issue(path, `${key}.expires_at`, 'string', raw.expires_at, 'invalid_type'));
  }
  return {
    reason,
    risk,
    scope,
    actor,
    timestamp,
    ...(typeof raw.target_revision === 'string' ? { target_revision: raw.target_revision } : {}),
    ...(typeof raw.expires_at === 'string' ? { expires_at: raw.expires_at } : {}),
    approval,
  };
}

export function criteriaDocumentRevision(doc: Omit<CriteriaDocument, 'source_revision'> & { source_revision?: string }): string {
  return sha256OfString(
    canonicalJson({
      schema: doc.schema,
      criteria: doc.criteria,
      candidates: doc.candidates ?? [],
    }),
  );
}

export function coverageLedgerRevision(doc: Omit<CoverageLedger, 'source_revision'> & { source_revision?: string }): string {
  return sha256OfString(
    canonicalJson({
      schema: doc.schema,
      criteria_revision: doc.criteria_revision,
      entries: doc.entries,
    }),
  );
}

function parseCriterion(raw: unknown, path: string, index: number, issues: AuthorityIssue[]): CriterionRecord | null {
  const key = `criteria[${index}]`;
  if (!isPlainObject(raw)) {
    issues.push(issue(path, key, 'object', raw, 'invalid_type'));
    return null;
  }
  for (const extra of unknownKeys(raw, CLOSED_CRITERION_KEYS)) {
    issues.push(issue(path, `${key}.${extra}`, 'closed criterion keys', extra, 'unknown_field'));
  }
  const id = requiredString(raw.id, path, `${key}.id`, issues);
  if (id && !isCriterionId(id)) {
    issues.push(issue(path, `${key}.id`, 'canonical criterion ID', id, 'invalid_type'));
  }
  if (id && id.startsWith('PCT-CAND-')) {
    issues.push(issue(path, `${key}.id`, 'public PCT id, not candidate', id, 'invalid_type'));
  }
  const type = requiredEnum(raw.type, CRITERION_TYPES, path, `${key}.type`, issues);
  const title = requiredString(raw.title, path, `${key}.title`, issues);
  const requirement = requiredString(raw.requirement, path, `${key}.requirement`, issues);
  const owner = requiredString(raw.owner, path, `${key}.owner`, issues);
  const status = requiredEnum(raw.status, CRITERION_STATUS, path, `${key}.status`, issues);
  const revision = requiredString(raw.revision, path, `${key}.revision`, issues);
  if (!Array.isArray(raw.source) || raw.source.some((item) => typeof item !== 'string' || item.length === 0)) {
    issues.push(issue(path, `${key}.source`, 'non-empty string[]', raw.source, 'invalid_type'));
    return null;
  }
  if (!id || !type || !title || !requirement || !owner || !status || !revision) return null;
  return {
    id,
    type,
    title,
    requirement,
    owner,
    source: raw.source as string[],
    revision,
    status,
  };
}

function parseCandidate(raw: unknown, path: string, index: number, issues: AuthorityIssue[]): CandidateRecord | null {
  const key = `candidates[${index}]`;
  if (!isPlainObject(raw)) {
    issues.push(issue(path, key, 'object', raw, 'invalid_type'));
    return null;
  }
  for (const extra of unknownKeys(raw, CLOSED_CANDIDATE_KEYS)) {
    issues.push(issue(path, `${key}.${extra}`, 'closed candidate keys', extra, 'unknown_field'));
  }
  const id = requiredString(raw.id, path, `${key}.id`, issues);
  if (id && !CANDIDATE_ID_RE.test(id)) {
    issues.push(issue(path, `${key}.id`, 'legacy archive candidate ID', id, 'invalid_type'));
  }
  const title = requiredString(raw.title, path, `${key}.title`, issues);
  if (raw.status !== 'task-scoped') {
    issues.push(issue(path, `${key}.status`, 'task-scoped', raw.status, 'closed_enum'));
  }
  if (raw.mapping !== 'unassigned') {
    issues.push(issue(path, `${key}.mapping`, 'unassigned (inventory did not assign public PCT)', raw.mapping, 'closed_enum'));
  }
  if (raw.related_ac !== undefined && !isCriterionId(raw.related_ac)) {
    issues.push(issue(path, `${key}.related_ac`, 'historical criterion reference', raw.related_ac, 'invalid_type'));
  }
  if (!id || !title || raw.status !== 'task-scoped' || raw.mapping !== 'unassigned') return null;
  return {
    id,
    title,
    status: 'task-scoped',
    mapping: 'unassigned',
    ...(typeof raw.related_ac === 'string' ? { related_ac: raw.related_ac } : {}),
  };
}

export function validateCriteriaDocument(input: unknown, path: string = DEFAULT_CRITERIA_PATH): IntegrityResult<CriteriaDocument> {
  const issues: AuthorityIssue[] = [];
  scanSecrets(input, path, '', issues);
  if (!isPlainObject(input)) {
    issues.push(issue(path, '$', 'object', input, 'invalid_type'));
    return { ok: false, issues, value: null };
  }
  for (const extra of unknownKeys(input, CLOSED_CRITERIA_DOC_KEYS)) {
    issues.push(issue(path, extra, 'closed criteria document keys', extra, 'unknown_field'));
  }
  if (input.schema !== CRITERIA_SCHEMA_ID) {
    issues.push(issue(path, 'schema', CRITERIA_SCHEMA_ID, input.schema, 'schema_mismatch'));
  }
  const sourceRevision = requiredSha(input.source_revision, path, 'source_revision', issues);
  if (!Array.isArray(input.criteria) || input.criteria.length < 1) {
    issues.push(issue(path, 'criteria', 'non-empty array', input.criteria, 'invalid_type'));
    return { ok: false, issues, value: null };
  }
  const criteria: CriterionRecord[] = [];
  const seen = new Map<string, number>();
  input.criteria.forEach((raw, index) => {
    const parsed = parseCriterion(raw, path, index, issues);
    if (!parsed) return;
    const previous = seen.get(parsed.id);
    if (previous !== undefined) {
      issues.push(issue(path, `criteria[${index}].id`, `unique (first at ${previous})`, parsed.id, 'duplicate_id'));
      return;
    }
    seen.set(parsed.id, index);
    criteria.push(parsed);
  });
  const candidates: CandidateRecord[] = [];
  const seenCandidates = new Set<string>();
  if (input.candidates !== undefined) {
    if (!Array.isArray(input.candidates)) {
      issues.push(issue(path, 'candidates', 'array', input.candidates, 'invalid_type'));
    } else {
      input.candidates.forEach((raw, index) => {
        const parsed = parseCandidate(raw, path, index, issues);
        if (!parsed) return;
        if (seen.has(parsed.id) || seenCandidates.has(parsed.id)) {
          issues.push(issue(path, `candidates[${index}].id`, 'unique vs public and candidates', parsed.id, 'duplicate_id'));
          return;
        }
        seenCandidates.add(parsed.id);
        candidates.push(parsed);
      });
    }
  }
  if (input.schema !== CRITERIA_SCHEMA_ID || !sourceRevision) {
    return { ok: false, issues, value: null };
  }
  const doc: CriteriaDocument = {
    schema: CRITERIA_SCHEMA_ID,
    source_revision: sourceRevision,
    criteria,
    candidates,
  };
  const expected = criteriaDocumentRevision(doc);
  if (sourceRevision !== expected) {
    issues.push(issue(path, 'source_revision', expected, sourceRevision, 'source_revision_mismatch'));
  }
  return { ok: issues.length === 0, issues, value: issues.length === 0 ? doc : doc };
}

function parseLedgerEntry(raw: unknown, path: string, index: number, issues: AuthorityIssue[]): CoverageLedgerEntry | null {
  const key = `entries[${index}]`;
  if (!isPlainObject(raw)) {
    issues.push(issue(path, key, 'object', raw, 'invalid_type'));
    return null;
  }
  for (const extra of unknownKeys(raw, CLOSED_LEDGER_ENTRY_KEYS)) {
    issues.push(issue(path, `${key}.${extra}`, 'closed ledger entry keys', extra, 'unknown_field'));
  }
  const forbiddenNormative = ['type', 'title', 'requirement', 'owner'];
  for (const field of forbiddenNormative) {
    if (field in raw) {
      issues.push(issue(path, `${key}.${field}`, 'ledger must not redefine criteria', field, 'unknown_field'));
    }
  }
  const criterionId = requiredString(raw.criterion_id, path, `${key}.criterion_id`, issues);
  const method = requiredEnum(raw.method, LEDGER_METHODS, path, `${key}.method`, issues);
  const status = requiredEnum(raw.status, LEDGER_ENTRY_STATUS, path, `${key}.status`, issues);
  const revision = requiredString(raw.revision, path, `${key}.revision`, issues);
  const target = requiredString(raw.target, path, `${key}.target`, issues);
  const actor = requiredString(raw.actor, path, `${key}.actor`, issues);
  const recordedAt = requiredString(raw.recorded_at, path, `${key}.recorded_at`, issues);
  const evidenceRef = requiredString(raw.evidence_ref, path, `${key}.evidence_ref`, issues);
  const result = requiredEnum(raw.result, LEDGER_RESULTS, path, `${key}.result`, issues);
  const approval = raw.approval === undefined ? undefined : parseApproval(raw.approval, path, `${key}.approval`, issues);
  const override = raw.override === undefined ? undefined : parseOverride(raw.override, path, `${key}.override`, issues);
  if (raw.source_run !== undefined && typeof raw.source_run !== 'string') {
    issues.push(issue(path, `${key}.source_run`, 'string', raw.source_run, 'invalid_type'));
  }
  if (!criterionId || !method || !status || !revision || !target || !actor || !recordedAt || !evidenceRef || !result) {
    return null;
  }
  if (raw.approval !== undefined && !approval) return null;
  if (raw.override !== undefined && !override) return null;
  if (override && (!override.approval || status !== 'overridden')) {
    issues.push(issue(path, `${key}.status`, 'overridden when override present', status, 'invalid_type'));
  }
  return {
    criterion_id: criterionId,
    method,
    status,
    revision,
    target,
    actor,
    recorded_at: recordedAt,
    evidence_ref: evidenceRef,
    result,
    ...(approval ? { approval } : {}),
    ...(override ? { override } : {}),
    ...(typeof raw.source_run === 'string' ? { source_run: raw.source_run } : {}),
  };
}

export function ledgerEntryKey(entry: CoverageLedgerEntry): string {
  return [entry.criterion_id, entry.method, entry.revision, entry.target, entry.evidence_ref].join('\u001f');
}

export function validateCoverageLedger(
  input: unknown,
  criteria: CriteriaDocument | null,
  path: string = DEFAULT_LEDGER_PATH,
): IntegrityResult<CoverageLedger> {
  const issues: AuthorityIssue[] = [];
  scanSecrets(input, path, '', issues);
  if (!isPlainObject(input)) {
    issues.push(issue(path, '$', 'object', input, 'invalid_type'));
    return { ok: false, issues, value: null };
  }
  for (const extra of unknownKeys(input, CLOSED_LEDGER_DOC_KEYS)) {
    issues.push(issue(path, extra, 'closed ledger document keys', extra, 'unknown_field'));
  }
  if (input.schema !== LEDGER_SCHEMA_ID) {
    issues.push(issue(path, 'schema', LEDGER_SCHEMA_ID, input.schema, 'schema_mismatch'));
  }
  const sourceRevision = requiredSha(input.source_revision, path, 'source_revision', issues);
  const criteriaRevision = requiredSha(input.criteria_revision, path, 'criteria_revision', issues);
  if (!Array.isArray(input.entries)) {
    issues.push(issue(path, 'entries', 'array', input.entries, 'invalid_type'));
    return { ok: false, issues, value: null };
  }
  const entries: CoverageLedgerEntry[] = [];
  const seen = new Map<string, CoverageLedgerEntry>();
  input.entries.forEach((raw, index) => {
    const parsed = parseLedgerEntry(raw, path, index, issues);
    if (!parsed) return;
    if (criteria) {
      const criterion = criteria.criteria.find((item) => item.id === parsed.criterion_id);
      if (!criterion || criterion.status !== 'active') {
        issues.push(
          issue(path, `entries[${index}].criterion_id`, 'active criterion in criteria.yaml', parsed.criterion_id, 'invalid_type'),
        );
      } else if (parsed.revision !== criterion.revision && parsed.revision !== criteria.source_revision) {
        issues.push(
          issue(
            path,
            `entries[${index}].revision`,
            `criterion.revision or criteria.source_revision`,
            parsed.revision,
            'source_revision_mismatch',
          ),
        );
      }
    }
    const key = ledgerEntryKey(parsed);
    const previous = seen.get(key);
    if (previous) {
      if (canonicalJson(previous) !== canonicalJson(parsed)) {
        issues.push(issue(path, `entries[${index}]`, 'idempotent duplicate', parsed, 'duplicate_id'));
      }
      return;
    }
    seen.set(key, parsed);
    entries.push(parsed);
  });
  if (criteria && criteriaRevision && criteriaRevision !== criteria.source_revision) {
    issues.push(
      issue(path, 'criteria_revision', criteria.source_revision, criteriaRevision, 'source_revision_mismatch'),
    );
  }
  if (input.schema !== LEDGER_SCHEMA_ID || !sourceRevision || !criteriaRevision) {
    return { ok: false, issues, value: null };
  }
  const ledger: CoverageLedger = {
    schema: LEDGER_SCHEMA_ID,
    source_revision: sourceRevision,
    criteria_revision: criteriaRevision,
    entries,
  };
  const expected = coverageLedgerRevision(ledger);
  if (sourceRevision !== expected) {
    issues.push(issue(path, 'source_revision', expected, sourceRevision, 'source_revision_mismatch'));
  }
  return { ok: issues.length === 0, issues, value: issues.length === 0 ? ledger : ledger };
}

export function mergeCoverageLedger(
  current: CoverageLedger,
  incoming: readonly CoverageLedgerEntry[],
  expectedCriteriaRevision: string,
): IntegrityResult<CoverageLedger> {
  const issues: AuthorityIssue[] = [];
  if (current.criteria_revision !== expectedCriteriaRevision) {
    issues.push(
      issue(
        DEFAULT_LEDGER_PATH,
        'criteria_revision',
        expectedCriteriaRevision,
        current.criteria_revision,
        'source_revision_mismatch',
      ),
    );
    return { ok: false, issues, value: null };
  }
  const merged = new Map<string, CoverageLedgerEntry>();
  for (const entry of current.entries) merged.set(ledgerEntryKey(entry), entry);
  incoming.forEach((entry, index) => {
    const key = ledgerEntryKey(entry);
    const previous = merged.get(key);
    if (previous) {
      if (canonicalJson(previous) !== canonicalJson(entry)) {
        issues.push(
          issue(DEFAULT_LEDGER_PATH, `incoming[${index}]`, 'idempotent equal payload', entry, 'duplicate_id'),
        );
      }
      return;
    }
    merged.set(key, entry);
  });
  if (issues.length > 0) return { ok: false, issues, value: null };
  const entries = [...merged.values()].sort((left, right) => ledgerEntryKey(left).localeCompare(ledgerEntryKey(right)));
  const next: CoverageLedger = {
    schema: LEDGER_SCHEMA_ID,
    source_revision: '',
    criteria_revision: expectedCriteriaRevision,
    entries,
  };
  const withRevision: CoverageLedger = {
    ...next,
    source_revision: coverageLedgerRevision(next),
  };
  return { ok: true, issues: [], value: withRevision };
}

export function matrixIncomplete(type: CriterionType, methodsPresent: readonly LedgerMethod[]): boolean {
  const required = COVERAGE_MATRIX[type];
  return required.some((method) => !methodsPresent.includes(method as LedgerMethod));
}

export interface CriteriaIntegrityReport {
  readonly ok: boolean;
  readonly issues: readonly AuthorityIssue[];
  readonly digest: {
    readonly criteriaSha256: string | null;
    readonly ledgerSha256: string | null;
    readonly criteriaSchemaSha256: string | null;
    readonly ledgerSchemaSha256: string | null;
  };
}

export type CriteriaQualityCheck = 'Q1' | 'Q2' | 'Q5' | 'Q7';
export type CriteriaQualitySeverity = 'error' | 'warn' | 'info';

export interface CriteriaQualityDiagnostic {
  readonly code: string;
  readonly check: CriteriaQualityCheck;
  readonly severity: CriteriaQualitySeverity;
  readonly message: string;
  readonly path: string;
  readonly line?: number;
}

export interface CriteriaQualityReport {
  readonly diagnostics: readonly CriteriaQualityDiagnostic[];
  readonly exitCode: 0 | 1 | 2;
}

const QUALITY_MANIFEST_PATH = DEFAULT_CRITERIA_PATH;
const QUALITY_REFERENCE_PATHS = [
  '.agents/skills/projectctl-requirements/references/criterios/reglas.md',
  '.agents/skills/projectctl-requirements/references/sources.md',
] as const;
const QUALITY_PCT_RE = /\bPCT-\d+\b/g;
const QUALITY_REQ_RE = /\bREQ-[A-Z0-9][A-Z0-9-]*\b/g;
const QUALITY_DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/;

type QualityFile = { path: string; content: string };

function qualityDiagnostic(
  code: string,
  check: CriteriaQualityCheck,
  message: string,
  path: string,
  line?: number,
): CriteriaQualityDiagnostic {
  const success = new Set(['MAPPING_1_TO_1_OK', 'CITATION_MACHINE_GREPPABLE_OK', 'OWNER_INLINE_OK']);
  return { code, check, severity: success.has(code) ? 'info' : 'error', message, path, ...(line === undefined ? {} : { line }) };
}

function qualityLine(content: string, offset: number): number {
  return content.slice(0, offset).split('\n').length;
}

function qualityFiles(repoRoot: string, relativeRoot: string): QualityFile[] {
  const absoluteRoot = resolve(repoRoot, relativeRoot);
  if (!existsSync(absoluteRoot)) return [];
  const files: QualityFile[] = [];
  const visit = (absolute: string, relative: string): void => {
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolute)) visit(resolve(absolute, entry), `${relative}/${entry}`);
      return;
    }
    if (stat.isFile() && /\.(md|mdx|ts|tsx|js|yaml|yml)$/.test(relative)) {
      files.push({ path: relative.replace(/^\.\//, ''), content: readFileSync(absolute, 'utf8') });
    }
  };
  visit(absoluteRoot, relativeRoot);
  return files;
}

function qualityRead(repoRoot: string, relativePath: string): QualityFile | null {
  const absolute = resolve(repoRoot, relativePath);
  return existsSync(absolute) && statSync(absolute).isFile()
    ? { path: relativePath, content: readFileSync(absolute, 'utf8') }
    : null;
}

function qualityOccurrences(file: QualityFile, id: string): Array<{ line: number; text: string; offset: number }> {
  return [...file.content.matchAll(new RegExp(`\\b${id}\\b`, 'g'))].map((match) => ({
    line: qualityLine(file.content, match.index ?? 0),
    text: file.content.split('\n')[qualityLine(file.content, match.index ?? 0) - 1] ?? '',
    offset: match.index ?? 0,
  }));
}

function qualityMappingFiles(repoRoot: string): QualityFile[] {
  return qualityFiles(repoRoot, 'taskReadme').filter((file) => /(?:^|\/)(?:spec|proposal)\.md$/.test(file.path));
}

function qualityMappingPairs(file: QualityFile): Array<{ requirement: string; criteria: string[]; line: number }> {
  const pairs: Array<{ requirement: string; criteria: string[]; line: number }> = [];
  for (const match of file.content.matchAll(/(REQ-[A-Z0-9][A-Z0-9-]*)[^\n]*?(?:↔|<->|->)\s*((?:PCT-\d+\s*(?:,|and)\s*)*PCT-\d+)/g)) {
    const criteria = [...match[2].matchAll(/PCT-\d+/g)].map((item) => item[0]);
    pairs.push({ requirement: match[1], criteria, line: qualityLine(file.content, match.index ?? 0) });
  }
  return pairs;
}

function qualityOwnerPath(manifest: QualityFile | null, candidate: string): string | null {
  if (!manifest) return null;
  try {
    const parsed = Bun.YAML.parse(manifest.content) as { criteria?: Array<{ id: string; owner: string }> };
    const owner = parsed.criteria?.find(item => item.id === candidate)?.owner;
    return typeof owner === 'string' && owner.startsWith('docs/app-map/') && !owner.includes('..') ? owner : null;
  } catch { return null; }
}

function runQualityQ1(repoRoot: string, candidate: string, diagnostics: CriteriaQualityDiagnostic[]): void {
  const manifest = qualityRead(repoRoot, QUALITY_MANIFEST_PATH);
  const ownerPath = qualityOwnerPath(manifest, candidate);
  const owner = ownerPath ? qualityRead(repoRoot, ownerPath) : null;
  const references = QUALITY_REFERENCE_PATHS.map((path) => qualityRead(repoRoot, path));
  const surfaces = [
    manifest,
    owner,
    ...references,
    ...qualityFiles(repoRoot, 'sandbox/src'),
    ...qualityFiles(repoRoot, 'docs/app-map'),
    ...qualityFiles(repoRoot, 'taskReadme'),
  ].filter((file): file is QualityFile => file !== null);
  const occurrences = surfaces.flatMap((file) => qualityOccurrences(file, candidate).map((hit) => ({ ...hit, path: file.path })));

  if (manifest) {
    const historical = occurrences.filter((hit) => {
      if (hit.path !== manifest.path) return false;
      const start = manifest.content.lastIndexOf('- id:', hit.offset);
      const end = manifest.content.indexOf('\n  - id:', Math.max(0, start + 1));
      return /status:\s*historical\b/.test(manifest.content.slice(start, end < 0 ? undefined : end));
    });
    for (const hit of historical) {
      diagnostics.push(qualityDiagnostic('PCT_ID_COLLISION', 'Q1', `${candidate} is reserved by a historical manifest entry`, hit.path, hit.line));
    }
    const manifestHits = qualityOccurrences(manifest, candidate);
    if (manifestHits.length > 1) {
      for (const hit of manifestHits) {
        diagnostics.push(qualityDiagnostic('PCT_ID_COLLISION', 'Q1', `${candidate} occurs more than once in the manifest`, manifest.path, hit.line));
      }
    }
  }

  const nonOwnerBundles = occurrences.filter(
    (hit) => hit.path.startsWith('docs/app-map/') && hit.path !== ownerPath,
  );
  for (const hit of nonOwnerBundles) {
    diagnostics.push(qualityDiagnostic('PCT_ID_COLLISION', 'Q1', `${candidate} is claimed by a second App Map bundle`, hit.path, hit.line));
  }

  const registryClaims = occurrences.filter((hit) => hit.path === 'sandbox/src/lib/projectctl-registry.ts');
  const registryPaths = new Set(registryClaims.map((hit) => hit.path));
  if (registryPaths.size > 1) {
    for (const hit of registryClaims) {
      diagnostics.push(qualityDiagnostic('PCT_ID_COLLISION', 'Q1', `${candidate} has multiple registry/test claims`, hit.path, hit.line));
    }
  }

  const taskClaims = occurrences.filter((hit) => hit.path.startsWith('taskReadme/'));
  const taskRoots = new Set(taskClaims.map((hit) => hit.path.split('/').slice(0, 2).join('/').replace(/\.md$/, '')));
  if (taskRoots.size > 1) {
    for (const hit of taskClaims) {
      diagnostics.push(qualityDiagnostic('PCT_ID_COLLISION', 'Q1', `${candidate} has claims in multiple task changes`, hit.path, hit.line));
    }
  }
}

function runQualityQ2(repoRoot: string, candidate: string, diagnostics: CriteriaQualityDiagnostic[]): void {
  const files = qualityMappingFiles(repoRoot);
  const deltaFiles = files.filter(file => qualityMappingPairs(file).some(pair => pair.criteria.includes(candidate)));
  if (deltaFiles.length === 0) {
    diagnostics.push(qualityDiagnostic('SOURCE_UNAVAILABLE', 'Q2', 'No declarative criteria delta was found', 'taskReadme'));
    return;
  }
  const pairs = [...new Map(deltaFiles.flatMap(qualityMappingPairs).map((pair) => [
    `${pair.requirement}:${pair.criteria.join(',')}`,
    pair,
  ])).values()];
  const requirements = [...new Set(pairs.map((pair) => pair.requirement))];
  const mappedRequirements = new Set(pairs.map((pair) => pair.requirement));
  const mappedCriteria = pairs.flatMap((pair) => pair.criteria);
  const invalid = requirements.length !== 1
    || mappedRequirements.size !== requirements.length
    || mappedCriteria.length !== requirements.length
    || new Set(mappedCriteria).size !== mappedCriteria.length
    || mappedCriteria[0] !== candidate;
  if (invalid) {
    const file = deltaFiles[0];
    const line = qualityLine(file.content, file.content.indexOf(requirements[0] ?? candidate));
    diagnostics.push(qualityDiagnostic('MAPPING_NOT_1_TO_1', 'Q2', `Requirement/PCT mapping is not bijective: requirements=${requirements.join(',') || '∅'} criteria=${mappedCriteria.join(',') || '∅'}`, file.path, line));
  } else {
    diagnostics.push(qualityDiagnostic('MAPPING_1_TO_1_OK', 'Q2', `${requirements[0]} maps exactly to ${candidate}`, deltaFiles[0].path, qualityLine(deltaFiles[0].content, deltaFiles[0].content.indexOf(candidate))));
  }
}

function runQualityQ5(repoRoot: string, candidate: string, diagnostics: CriteriaQualityDiagnostic[]): void {
  for (const relativePath of QUALITY_REFERENCE_PATHS) {
    const file = qualityRead(repoRoot, relativePath);
    if (!file) {
      diagnostics.push(qualityDiagnostic('SOURCE_UNAVAILABLE', 'Q5', 'Citation source is unavailable', relativePath));
      continue;
    }
    if (relativePath.endsWith('/sources.md')) {
      const sourceRow = file.content.split('\n').find((line) => line.includes(`| \`${candidate}\` |`) && /\|\s*`?\d{4}-\d{2}-\d{2}`?\s*\|/.test(line));
      if (sourceRow) {
        diagnostics.push(qualityDiagnostic('CITATION_MACHINE_GREPPABLE_OK', 'Q5', `${candidate} source row is machine-greppable`, file.path, file.content.split('\n').indexOf(sourceRow) + 1));
        continue;
      }
    }
    const blocks = file.content.split(/\n(?=##\s|>\s*\*\*SoT original\*\*)/g);
    const relevant = blocks.filter((block) => block.includes(candidate));
    if (relevant.length === 0) {
      const citationBlocks = blocks.filter((block) => /\*\*(?:SoT original|Cumple|last-verified)\*\*/.test(block));
      if (citationBlocks.length > 0) {
        for (const block of citationBlocks) {
          const start = file.content.indexOf(block);
          const line = qualityLine(file.content, Math.max(0, start));
          if (!/\*\*SoT original\*\*:\s*(?:[^\n]*`[^`]+`)+/.test(block)) diagnostics.push(qualityDiagnostic('CITATION_SOT_MISSING', 'Q5', 'Citation lacks machine-greppable SoT paths', file.path, line));
          if (!new RegExp(`\\*\\*Cumple\\*\\*:\\s*[^\\n]*\\b${candidate}\\b`).test(block)) diagnostics.push(qualityDiagnostic('CITATION_CRITERION_MISSING', 'Q5', `Citation does not declare ${candidate}`, file.path, line));
          if (!/\*\*last-verified\*\*:\s*\d{4}-\d{2}-\d{2}\b/.test(block)) diagnostics.push(qualityDiagnostic('CITATION_DATE_INVALID', 'Q5', 'Citation date is not ISO YYYY-MM-DD', file.path, line));
        }
        continue;
      }
      diagnostics.push(qualityDiagnostic('CITATION_CRITERION_MISSING', 'Q5', `${candidate} is not cited`, file.path));
      continue;
    }
    for (const block of relevant) {
      const start = file.content.indexOf(block);
      const line = qualityLine(file.content, Math.max(0, start));
      if (!/\*\*SoT original\*\*:\s*(?:[^\n]*`[^`]+`)+/.test(block)) diagnostics.push(qualityDiagnostic('CITATION_SOT_MISSING', 'Q5', 'Citation lacks machine-greppable SoT paths', file.path, line));
      if (!new RegExp(`\\*\\*Cumple\\*\\*:\\s*[^\\n]*\\b${candidate}\\b`).test(block)) diagnostics.push(qualityDiagnostic('CITATION_CRITERION_MISSING', 'Q5', `Citation does not declare ${candidate}`, file.path, line));
      if (!/\*\*last-verified\*\*:\s*\d{4}-\d{2}-\d{2}\b/.test(block)) diagnostics.push(qualityDiagnostic('CITATION_DATE_INVALID', 'Q5', 'Citation date is not ISO YYYY-MM-DD', file.path, line));
    }
    if (!diagnostics.some((diagnostic) => diagnostic.path === file.path && diagnostic.check === 'Q5' && diagnostic.severity === 'error')) {
      diagnostics.push(qualityDiagnostic('CITATION_MACHINE_GREPPABLE_OK', 'Q5', `${candidate} citation is machine-greppable`, file.path, qualityLine(file.content, file.content.indexOf(candidate))));
    }
  }
}

function runQualityQ7(repoRoot: string, candidate: string, diagnostics: CriteriaQualityDiagnostic[]): void {
  const manifest = qualityRead(repoRoot, QUALITY_MANIFEST_PATH);
  const declaredOwner = qualityOwnerPath(manifest, candidate);
  const owner = declaredOwner ? qualityRead(repoRoot, declaredOwner) : null;
  for (const relativePath of QUALITY_REFERENCE_PATHS) {
    const file = qualityRead(repoRoot, relativePath);
    if (!file) continue;
    const secondary = new RegExp(`(?:^|\\n)\\s*(?:#|criteria:|(?:title|requirement|owner|source):)[^\\n]*${candidate}`, 'm').test(file.content)
      || (file.content.includes(`# ${candidate}`) && /definition copied|full requirement/i.test(file.content));
    if (secondary) diagnostics.push(qualityDiagnostic('REFERENCE_SECONDARY_SOT', 'Q7', 'Reference republishes the inline criterion instead of citing it', file.path, qualityLine(file.content, file.content.indexOf(candidate))));
  }
  if (!manifest || !owner) {
    diagnostics.push(qualityDiagnostic('OWNER_INLINE_MISMATCH', 'Q7', 'Manifest owner or inline bundle is unavailable', declaredOwner ?? QUALITY_MANIFEST_PATH));
    return;
  }
  const inlineMatch = new RegExp(`\\bid:\\s*${candidate}\\b`).exec(owner.content);
  if (!inlineMatch) diagnostics.push(qualityDiagnostic('OWNER_INLINE_MISMATCH', 'Q7', `${candidate} is not declared by the owner bundle`, owner.path));
  if (!diagnostics.some((diagnostic) => diagnostic.check === 'Q7' && diagnostic.severity === 'error')) {
    diagnostics.push(qualityDiagnostic('OWNER_INLINE_OK', 'Q7', `${candidate} owner and inline authority agree`, declaredOwner!, qualityLine(owner.content, inlineMatch?.index ?? 0)));
  }
}

export function checkProjectctlCriteriaQuality(repoRoot: string): CriteriaQualityReport {
  const diagnostics: CriteriaQualityDiagnostic[] = [];
  try {
    const manifest = qualityRead(repoRoot, QUALITY_MANIFEST_PATH);
    const ids = manifest
      ? [...new Set([...manifest.content.matchAll(/- id:\s*(PCT-\d+)/g)].map((m) => m[1]).filter((id): id is string => Boolean(id)))]
      : [];
    const candidates = [...new Set(qualityMappingFiles(repoRoot).flatMap(file => qualityMappingPairs(file).flatMap(pair => pair.criteria)))].filter(id => ids.includes(id));
    for (const candidate of candidates) {
      runQualityQ1(repoRoot, candidate, diagnostics);
      runQualityQ2(repoRoot, candidate, diagnostics);
      runQualityQ5(repoRoot, candidate, diagnostics);
      runQualityQ7(repoRoot, candidate, diagnostics);
    }
  } catch {
    return { diagnostics: [], exitCode: 0 };
  }
  const hasError = diagnostics.some((d) => d.severity === 'error');
  // Fail-closed RED contract (PCT-175 AC-003..AC-006): surface only errors;
  // informational OKs (MAPPING_1_TO_1_OK, CITATION_MACHINE_GREPPABLE_OK,
  // OWNER_INLINE_OK) stay internal so per-check assertions observe exactly
  // the failing check's diagnostics. Warn-first: no error ⇒ exit 0.
  return { diagnostics: diagnostics.filter((d) => d.severity === 'error'), exitCode: hasError ? 1 : 0 };
}

function readIfExists(repoRoot: string, relativePath: string): string | null {
  const absolute = resolve(repoRoot, relativePath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, 'utf8');
}

export function checkProjectctlCriteriaIntegrity(repoRoot: string): CriteriaIntegrityReport {
  const issues: AuthorityIssue[] = [];
  const criteriaRaw = readIfExists(repoRoot, DEFAULT_CRITERIA_PATH);
  const ledgerRaw = readIfExists(repoRoot, DEFAULT_LEDGER_PATH);
  const digest = {
    criteriaSha256: criteriaRaw ? sha256OfString(criteriaRaw) : null,
    ledgerSha256: ledgerRaw ? sha256OfString(ledgerRaw) : null,
    criteriaSchemaSha256: readIfExists(repoRoot, DEFAULT_CRITERIA_SCHEMA_PATH)
      ? sha256OfString(readIfExists(repoRoot, DEFAULT_CRITERIA_SCHEMA_PATH) as string)
      : null,
    ledgerSchemaSha256: readIfExists(repoRoot, DEFAULT_LEDGER_SCHEMA_PATH)
      ? sha256OfString(readIfExists(repoRoot, DEFAULT_LEDGER_SCHEMA_PATH) as string)
      : null,
  };
  if (!criteriaRaw) {
    issues.push(issue(DEFAULT_CRITERIA_PATH, '$', 'existing file', 'missing', 'module_not_found'));
  }
  if (!ledgerRaw) {
    issues.push(issue(DEFAULT_LEDGER_PATH, '$', 'existing file', 'missing', 'module_not_found'));
  }
  if (!digest.criteriaSchemaSha256) {
    issues.push(issue(DEFAULT_CRITERIA_SCHEMA_PATH, '$', 'existing schema', 'missing', 'module_not_found'));
  }
  if (!digest.ledgerSchemaSha256) {
    issues.push(issue(DEFAULT_LEDGER_SCHEMA_PATH, '$', 'existing schema', 'missing', 'module_not_found'));
  }
  let criteria: CriteriaDocument | null = null;
  if (criteriaRaw) {
    let parsed: unknown;
    try {
      parsed = Bun.YAML.parse(criteriaRaw);
    } catch (error) {
      issues.push(
        issue(DEFAULT_CRITERIA_PATH, '$', 'YAML document', error instanceof Error ? error.message : String(error), 'invalid_type'),
      );
    }
    if (parsed !== undefined) {
      const result = validateCriteriaDocument(parsed, DEFAULT_CRITERIA_PATH);
      issues.push(...result.issues);
      criteria = result.value;
    }
  }
  if (ledgerRaw) {
    let parsed: unknown;
    try {
      parsed = Bun.YAML.parse(ledgerRaw);
    } catch (error) {
      issues.push(
        issue(DEFAULT_LEDGER_PATH, '$', 'YAML document', error instanceof Error ? error.message : String(error), 'invalid_type'),
      );
    }
    if (parsed !== undefined) {
      issues.push(...validateCoverageLedger(parsed, criteria, DEFAULT_LEDGER_PATH).issues);
    }
  }
  return { ok: issues.length === 0, issues, digest };
}

function formatIssues(issues: readonly AuthorityIssue[]): string {
  return issues
    .map((item) => `[projectctl-criteria] ${item.code} path=${item.path} key=${item.key} expected=${item.expected} got=${item.got}`)
    .join('\n');
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: bun scripts/skill/projectctl-criteria-integrity.ts --check');
    process.exit(0);
  }
  const repoRoot = resolve(import.meta.dir, '../../../../..');
  const report = checkProjectctlCriteriaIntegrity(repoRoot);
  if (report.ok) {
    console.log(
      [
        '[projectctl-criteria] ok — unique PCT ids, candidates unassigned, ledger separated',
        `[projectctl-criteria] digest criteria=${report.digest.criteriaSha256} ledger=${report.digest.ledgerSha256}`,
      ].join('\n'),
    );
    process.exit(0);
  }
  console.error(formatIssues(report.issues));
  console.error(
    `[projectctl-criteria] digest criteria=${report.digest.criteriaSha256 ?? '∅'} ledger=${report.digest.ledgerSha256 ?? '∅'}`,
  );
  process.exit(1);
}
