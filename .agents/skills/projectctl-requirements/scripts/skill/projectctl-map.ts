/** Portable MAP and revision primitives for the five-link core. */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const MAP_SCHEMA_ID = 'projectctl-map/v1';
export const DEFAULT_MAP_PATH = '.agents/skills/projectctl-requirements/MAP.md';
export const MAP_REQUIRED_COLUMNS = ['id', 'módulo', 'propósito', 'autoridad'] as const;
const COLUMNS = [...MAP_REQUIRED_COLUMNS, 'path', 'revision', 'kind', 'status'];
const STATUSES = ['current', 'declared-future', 'external'] as const;
const KINDS = ['package-entry', 'internal-current', 'internal-planned', 'external-policy', 'authority-source', 'operational-wrapper', 'satellite-reference'];
const AUTHORITIES = ['binding', 'projectctl-registry', 'criteria-manifest', 'coverage-ledger', 'Gentle-AI', 'frontend-policy', 'backend-api-policy', 'sandbox-runtime-policy', 'supabase-data-policy', 'skill-creator'];

export type AuthorityIssue = { path: string; key: string; expected: string; got: string; code: string };
export type MapRow = { id: string; modulo: string; proposito: string; autoridad: string; path?: string; revision?: string; kind?: string; status: typeof STATUSES[number]; line: number };
export type ParsedMap = { schema: string; source_revision: string; rows: MapRow[] };
export function sha256OfString(value: string): string { return createHash('sha256').update(value).digest('hex'); }
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}
const SECRET = /(?:api[_-]?key|secret|password|token|jwt)\s*[:=]\s*\S+|BEGIN (?:RSA |EC )?PRIVATE KEY|sk_live_|sb_secret_/i;
const HOST = /https?:\/\/|(?:\d{1,3}\.){3}\d{1,3}\b|localhost(?![\w-])|:(\d{2,5})\b|cloudflared?\b|host\.docker\.internal/i;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
export function detectSecretOrHostValue(value: string, path: string, key: string): AuthorityIssue | null {
  const expected = SECRET.test(value) ? 'no secrets' : HOST.test(value) ? 'no host identity / URLs / host ports' : UUID.test(value) ? 'no project/host UUIDs' : null;
  return expected ? { path, key, expected, got: JSON.stringify(value), code: 'secret_or_host_value' } : null;
}
function cells(line: string): string[] { return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()); }
export function parseProjectctlMap(markdown: string, repoRoot: string, path = DEFAULT_MAP_PATH): { ok: boolean; issues: AuthorityIssue[]; map: ParsedMap | null } {
  const issues: AuthorityIssue[] = [];
  const add = (key: string, expected: string, got: unknown, code: string) => issues.push({ path, key, expected, got: JSON.stringify(got), code });
  const forbidden = detectSecretOrHostValue(markdown, path, 'map');
  if (forbidden) issues.push(forbidden);
  const schema = markdown.match(/^schema:\s*(\S+)\s*$/m)?.[1];
  const revision = markdown.match(/^source_revision:\s*([a-f0-9]{64})\s*$/m)?.[1];
  if (schema !== MAP_SCHEMA_ID) add('schema', MAP_SCHEMA_ID, schema, 'schema_mismatch');
  if (!revision) add('source_revision', 'sha256 hex (64)', revision, 'invalid_type');
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex(line => cells(line).slice(0, 4).join('|') === MAP_REQUIRED_COLUMNS.join('|'));
  if (headerIndex < 0) { add('table', MAP_REQUIRED_COLUMNS.join('|'), 'missing header', 'schema_mismatch'); return { ok: false, issues, map: null }; }
  const header = cells(lines[headerIndex]);
  for (const column of header) if (!COLUMNS.includes(column as typeof COLUMNS[number])) add(`column.${column}`, COLUMNS.join('|'), column, 'unknown_field');
  if (!/^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(lines[headerIndex + 1] ?? '')) add('table', 'markdown separator row', lines[headerIndex + 1], 'schema_mismatch');
  const rows: MapRow[] = [];
  const ids = new Set<string>();
  for (let i = headerIndex + 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim().startsWith('|')) { if (line.trim()) break; continue; }
    const values = cells(line);
    if (values.length !== header.length) { add(`line.${i + 1}`, `${header.length} cells`, values.length, 'invalid_type'); continue; }
    const record = Object.fromEntries(header.map((column, index) => [column, values[index]]));
    const { id, ['módulo']: modulo, ['propósito']: proposito, autoridad } = record;
    if (!id || !modulo || !proposito || !autoridad) { add(`line.${i + 1}`, 'non-empty required cells', record, 'invalid_type'); continue; }
    if (ids.has(id)) add(`id.${id}`, 'unique MAP id', id, 'duplicate_id');
    ids.add(id);
    if (!AUTHORITIES.includes(autoridad)) add(`id.${id}.autoridad`, AUTHORITIES.join('|'), autoridad, 'closed_enum');
    const status = record.status || 'current';
    if (!STATUSES.includes(status as typeof STATUSES[number])) { add(`id.${id}.status`, STATUSES.join('|'), status, 'closed_enum'); continue; }
    if (record.kind && !KINDS.includes(record.kind)) add(`id.${id}.kind`, KINDS.join('|'), record.kind, 'closed_enum');
    const rel = relative(repoRoot, resolve(repoRoot, modulo));
    const exists = !isAbsolute(modulo) && !rel.startsWith('..') && existsSync(resolve(repoRoot, modulo));
    if (status === 'current' && !exists) add(`id.${id}.módulo`, 'existing path for status=current (or status=declared-future)', modulo, 'module_not_found');
    rows.push({ id, modulo, proposito, autoridad, ...(record.path ? { path: record.path } : {}), ...(record.revision ? { revision: record.revision } : {}), ...(record.kind ? { kind: record.kind } : {}), status: status as typeof STATUSES[number], line: i + 1 });
  }
  if (!revision || schema !== MAP_SCHEMA_ID) return { ok: false, issues, map: null };
  const expected = sha256OfString(`${MAP_SCHEMA_ID}\n${rows.map(row => [row.id, row.modulo, row.proposito, row.autoridad, row.path ?? '', row.kind ?? '', row.status].join('|')).join('\n')}\n`);
  if (revision !== expected) add('source_revision', expected, revision, 'source_revision_mismatch');
  return { ok: issues.length === 0, issues, map: { schema: MAP_SCHEMA_ID, source_revision: revision, rows } };
}
