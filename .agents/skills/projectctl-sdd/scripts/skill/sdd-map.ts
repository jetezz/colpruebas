/** Exact, revision-bound MAP reader for the portable SDD lane resolver. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const MAP_SCHEMA_ID = 'projectctl-map/v1';
export const DEFAULT_MAP_PATH = '.agents/skills/projectctl-sdd/MAP.md';
export const sha256OfString = (value: string): string => createHash('sha256').update(value).digest('hex');
export interface MapRow {
  id: string; modulo: string; proposito: string; autoridad: string;
  path?: string; kind?: string; status: 'current' | 'external' | 'declared-future';
}
export interface ParsedMap { source_revision: string; rows: MapRow[] }
export function lookupMapRow(map: ParsedMap, id: string): MapRow | null {
  return map.rows.find(row => row.id === id) ?? null;
}
export function parseProjectctlMap(raw: string, root: string, path = DEFAULT_MAP_PATH): { map: ParsedMap | null; issues: Array<{code: string; key: string; got: string}> } {
  const issues: Array<{code: string; key: string; got: string}> = [];
  const fail = (code: string, key: string, got: string): void => { issues.push({ code, key, got }); };
  const schema = raw.match(/^schema:\s*(\S+)\s*$/m)?.[1];
  const revision = raw.match(/^source_revision:\s*([a-f0-9]{64})\s*$/m)?.[1];
  if (schema !== MAP_SCHEMA_ID) fail('schema_mismatch', 'schema', String(schema));
  if (!revision) fail('source_revision_mismatch', 'source_revision', String(revision));
  const lines = raw.split(/\r?\n/);
  const cells = (line: string): string[] => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
  const header = lines.findIndex(line => cells(line).slice(0, 4).join('|') === 'id|módulo|propósito|autoridad');
  if (header < 0 || !/^\s*\|[\s|:-]+\|\s*$/.test(lines[header + 1] ?? '')) fail('schema_mismatch', 'table', path);
  const columns = header < 0 ? [] : cells(lines[header]);
  const rows: MapRow[] = [];
  const seen = new Set<string>();
  for (const line of lines.slice(header + 2)) {
    if (!line.trim().startsWith('|')) { if (line.trim()) break; else continue; }
    const values = cells(line);
    if (values.length !== columns.length) { fail('invalid_type', 'cells', line); continue; }
    const row = Object.fromEntries(columns.map((column, i) => [column, values[i]]));
    const id = row.id ?? '';
    if (!id || !row['módulo'] || !row['propósito'] || !row.autoridad || seen.has(id)) fail('invalid_type', id, line);
    seen.add(id);
    const status = (row.status || 'current') as MapRow['status'];
    if (!['current', 'external', 'declared-future'].includes(status)) fail('closed_enum', id, status);
    if (status === 'current' && !existsSync(resolve(root, row['módulo']))) fail('module_not_found', id, row['módulo']);
    rows.push({ id, modulo: row['módulo'], proposito: row['propósito'], autoridad: row.autoridad,
      ...(row.path ? { path: row.path } : {}), ...(row.kind ? { kind: row.kind } : {}), status });
  }
  const canonical = rows.map(row => [row.id, row.modulo, row.proposito, row.autoridad, row.path ?? '', row.kind ?? '', row.status].join('|')).join('\n');
  if (revision && revision !== sha256OfString(`${MAP_SCHEMA_ID}\n${canonical}\n`)) fail('source_revision_mismatch', 'source_revision', revision);
  return { map: revision && schema === MAP_SCHEMA_ID ? { source_revision: revision, rows } : null, issues };
}

// Read-only maintenance command; update the reported digest through the normal editor.
if (import.meta.main) {
  const root = resolve(import.meta.dir, '../../../../..');
  const result = parseProjectctlMap(readFileSync(resolve(root, DEFAULT_MAP_PATH), 'utf8'), root);
  if (!result.map) throw new Error('MAP not parseable');
  const canonical = result.map.rows.map(row => [row.id, row.modulo, row.proposito, row.autoridad, row.path ?? '', row.kind ?? '', row.status].join('|')).join('\n');
  console.log(sha256OfString(`${MAP_SCHEMA_ID}\n${canonical}\n`));
}
