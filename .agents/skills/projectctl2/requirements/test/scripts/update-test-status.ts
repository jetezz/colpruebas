#!/usr/bin/env bun
import { randomUUID } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDict, isText, loadNavigation, testFile, TEST_STATUSES, validateViewTestData, type View } from './test-contract.ts';

type Args = { root: string; ids: string[]; status: string; json: boolean; help: boolean };
type Patch = { id: string; lineIndex: number; original: string; updated: string };

function parseArgs(argv: string[]): Args {
  const result: Args = { root: process.cwd(), ids: [], status: '', json: false, help: false };
  const seen = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') { result.help = true; continue; }
    if (arg === '--json') { result.json = true; continue; }
    const match = arg.match(/^(--root|--ids|--status)(?:=(.*))?$/);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    if (seen.has(match[1]!)) throw new Error(`Option supplied more than once: ${match[1]}`);
    seen.add(match[1]!);
    const value = match[2] ?? argv[++i];
    if (!isText(value) || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}`);
    if (match[1] === '--root') result.root = resolve(value);
    else if (match[1] === '--status') result.status = value;
    else result.ids = value.split(',').map(id => id.trim());
  }
  if (result.help) return result;
  if (!result.ids.length || result.ids.some(id => !id)) throw new Error('Pass a comma-separated, non-empty --ids list.');
  if (new Set(result.ids).size !== result.ids.length) throw new Error('--ids contains duplicate criterion IDs.');
  if (!TEST_STATUSES.has(result.status)) throw new Error(`--status must be one of: ${[...TEST_STATUSES].join(', ')}`);
  return result;
}

function help() {
  return `Update only test status values in per-view YAML files.

Usage: bun update-test-status.ts --ids=ID1,ID2 --status=sin-test|rojo|verde [--root DIR] [--json]

--ids LIST       Comma-separated criterion IDs
--status VALUE   New status: sin-test, rojo, or verde
--root DIR       Project root (default: current directory)
--json           Print machine-readable output
--help, -h       Show this help`;
}

function idFromYamlLine(line: string): { indent: number; id?: string } | null {
  const match = line.match(/^(\s*)-\s+id:\s*(.*?)\s*$/);
  if (!match) return null;
  try {
    const parsed = Bun.YAML.parse(`value: ${match[2]}`);
    return { indent: match[1]!.length, id: isDict(parsed) && typeof parsed.value === 'string' ? parsed.value : undefined };
  } catch { return { indent: match[1]!.length }; }
}

function statusLine(lines: string[], criterionIndex: number, indent: number): number {
  let found = -1;
  for (let i = criterionIndex + 1; i < lines.length; i++) {
    const text = lines[i]!.replace(/\r?\n$/, '');
    if (!text.trim() || /^\s*#/.test(text)) continue;
    const lineIndent = text.match(/^\s*/)?.[0].length ?? 0;
    if (lineIndent <= indent) break;
    if (/^\s*status\s*:/.test(text)) {
      if (found !== -1) throw new Error('criterion test block has more than one status field');
      found = i;
    }
  }
  if (found === -1) throw new Error('could not locate a block-style status field under the criterion ID');
  return found;
}

function replaceStatus(line: string, nextStatus: string): string {
  if (/^\s*status:\s*[>|](?:[+-]|[1-9])*(?:\s*(?:#.*)?)?(?:\r?\n)?$/.test(line)) {
    throw new Error('status block scalars are not supported; use a plain or quoted scalar');
  }
  const match = line.match(/^(\s*status:\s*)(?:(["'])(.*?)\2|([^#\s]+))(\s*(?:#.*)?)((?:\r?\n)?)$/);
  if (!match) throw new Error('status must be a scalar on its own YAML line');
  const quote = match[2] ?? '';
  const current = match[3] ?? match[4];
  if (!current) throw new Error('status scalar is empty or unsupported');
  return `${match[1]}${quote}${nextStatus}${quote}${match[5]}${match[6]}`;
}

function lineParts(source: string): string[] { return source.match(/[^\n]*\n|[^\n]+$/g) ?? []; }

function validateTargetFile(view: View, file: string, raw: string) {
  const data = Bun.YAML.parse(raw);
  const issues = validateViewTestData(view, data, file);
  if (issues.length) throw new Error(issues.map(issue => `${issue.path}: ${issue.message}`).join('\n'));
  if (!isDict(data) || !Array.isArray(data.features)) throw new Error(`${file}: malformed test YAML`);
}

export function patchFile(view: View, file: string, source: string, ids: string[], nextStatus: string): { content: string; changedIds: string[] } {
  const lines = lineParts(source);
  const wanted = new Set(ids);
  const occurrences = new Map<string, Array<{ index: number; indent: number }>>();
  for (const id of ids) occurrences.set(id, []);
  lines.forEach((line, index) => {
    const found = idFromYamlLine(line);
    if (found?.id && wanted.has(found.id)) occurrences.get(found.id)!.push({ index, indent: found.indent });
  });
  const changedIds: string[] = [];
  for (const id of ids) {
    const matches = occurrences.get(id)!;
    if (matches.length !== 1) throw new Error(`${file}: expected one block-style criterion entry for ${id}, found ${matches.length}`);
    const target = statusLine(lines, matches[0]!.index, matches[0]!.indent);
    const updated = replaceStatus(lines[target]!, nextStatus);
    if (updated !== lines[target]) {
      lines[target] = updated;
      changedIds.push(id);
    }
  }
  return { content: lines.join(''), changedIds };
}

function stageAndCommit(files: Map<string, string>): string[] {
  const staged: Array<{ target: string; temp: string }> = [];
  try {
    for (const [target, content] of files) {
      const stat = lstatSync(target);
      if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${target}: expected a regular file`);
      const temp = `${target}.${process.pid}.${randomUUID()}.tmp`;
      writeFileSync(temp, content, { flag: 'wx', mode: stat.mode & 0o777 });
      staged.push({ target, temp });
    }
    for (const item of staged) renameSync(item.temp, item.target);
    return staged.map(item => item.target);
  } catch (error) {
    for (const item of staged) if (existsSync(item.temp)) unlinkSync(item.temp);
    throw error;
  }
}

function main() {
  let args: Args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`); process.exit(2); }
  if (args.help) { console.log(help()); return; }

  try {
    const docsScript = resolve(import.meta.dir, '../../docs/scripts/validate-app-map-docs.ts');
    const proc = Bun.spawnSync(['bun', docsScript, '--root', args.root, '--json'], { stdout: 'pipe', stderr: 'pipe' });
    if (proc.exitCode !== 0) throw new Error(`Cannot update test status until docs and criteria pass: ${(proc.stderr.toString() || proc.stdout.toString() || 'docs validation failed').trim()}`);
    const views = loadNavigation(args.root);
    const locations = new Map<string, Array<{ view: View; file: string }>>();
    for (const id of args.ids) locations.set(id, []);
    for (const view of views) {
      for (const feature of view.features) {
        for (const criterion of feature.criteria) {
          if (locations.has(criterion.id)) locations.get(criterion.id)!.push({ view, file: testFile(args.root, view) });
        }
      }
    }
    for (const [id, matches] of locations) if (matches.length !== 1) throw new Error(`${id}: expected one navigation criterion, found ${matches.length}`);

    const idsByFile = new Map<string, { view: View; ids: string[] }>();
    for (const [id, matches] of locations) {
      const target = matches[0]!;
      const entry = idsByFile.get(target.file) ?? { view: target.view, ids: [] };
      entry.ids.push(id);
      idsByFile.set(target.file, entry);
    }

    const updates = new Map<string, string>();
    const changedIds: string[] = [];
    for (const [file, target] of idsByFile) {
      if (!existsSync(file)) throw new Error(`${file}: test YAML is missing`);
      const original = readFileSync(file, 'utf8');
      validateTargetFile(target.view, file, original);
      const patched = patchFile(target.view, file, original, target.ids, args.status);
      if (patched.content !== original) updates.set(file, patched.content);
      changedIds.push(...patched.changedIds);
    }

    const changedFiles = stageAndCommit(updates);
    const result = { updated: changedIds.length, ids: changedIds, files: changedFiles, status: args.status };
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else console.log(changedIds.length ? `Updated ${changedIds.length} criterion status(es).` : 'No changes needed.');
  } catch (error) {
    if (args.json) console.log(JSON.stringify({ updated: 0, error: error instanceof Error ? error.message : String(error) }, null, 2));
    else console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (import.meta.main) main();
