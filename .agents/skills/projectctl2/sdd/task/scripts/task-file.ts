import { randomUUID } from 'node:crypto';
import { closeSync, lstatSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import type { TaskDocument } from '../../../types/contracts/index.ts';

// Canonical origin: writable TaskDocument frontmatter keys (types/contracts/task.ts).
// allowedFields and runSetter derive from this alias — no loose field literals in type positions.
type TaskField = keyof Pick<TaskDocument, 'phase' | 'state' | 'branch' | 'pr' | 'ui_url' | 'skills' | 'app_map' | 'expected' | 'criteria' | 'proposal_state' | 'functional_state' | 'requirements_fix'>;

export function projectRoot(): string {
  const proc = Bun.spawnSync(['git', 'rev-parse', '--show-toplevel'], { stdout: 'pipe', stderr: 'pipe' });
  const stdoutText = proc.stdout.toString();
  if (proc.exitCode !== 0 || !stdoutText.trim()) throw new Error('must run inside a git project');
  return resolve(stdoutText.trim());
}

function readTaskIndex(inputPath: string): { file: string; raw: string; frontmatter: string; taskDirectory: string; mode: number } {
  const root = projectRoot();
  const taskDirectory = join(root, 'taskReadme');
  const file = resolve(root, inputPath);
  const taskRelative = relative(taskDirectory, file);
  if (isAbsolute(taskRelative) || taskRelative.startsWith('..') || taskRelative.includes('/') || !taskRelative.endsWith('.md')) {
    throw new Error('task file must be a Markdown index directly inside taskReadme');
  }

  const directoryStat = lstatSync(taskDirectory);
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) throw new Error('taskReadme must be a real directory');
  const fileStat = lstatSync(file);
  if (!fileStat.isFile() || fileStat.isSymbolicLink()) throw new Error('task index must be a regular file');

  const original = readFileSync(file, 'utf8');
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(original);
  if (!frontmatter) throw new Error('task index has invalid frontmatter');
  return { file, raw: original, frontmatter: frontmatter[0], taskDirectory, mode: fileStat.mode };
}

export function readTaskValues(inputPath: string, fields: string[]): Record<string, unknown> {
  const parsed = readTaskDocument(inputPath);
  const values: Record<string, unknown> = {};
  for (const field of fields) {
    if (!Object.hasOwn(parsed, field)) throw new Error(`task index is missing ${field}`);
    values[field] = parsed[field as keyof TaskDocument];
  }
  return values;
}

export function readTaskDocument(inputPath: string): TaskDocument {
  const task = readTaskIndex(inputPath);
  const parsed = Bun.YAML.parse(task.frontmatter.replace(/^---\r?\n/, '').replace(/\r?\n---(?:\r?\n|$)$/, ''));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('task index frontmatter must be a mapping');
  const validation = validateDocument('task', parsed);
  if (!validation.valid) {
    throw new Error(`task index frontmatter is invalid: ${validation.issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
  }
  return validation.data;
}

export function readTaskFields(inputPath: string, fields: string[]): Record<string, string> {
  const values = readTaskValues(inputPath, fields);
  const strings: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field];
    if (typeof value !== 'string') throw new Error(`task index must contain a string ${field} field`);
    strings[field] = value;
  }
  return strings;
}

export function updateTaskField(inputPath: string, field: TaskField, value: string): void {
  updateTaskFields(inputPath, { [field]: value });
}

export function updateTaskFields(inputPath: string, values: Record<string, unknown>): void {
  const { file, raw: original, frontmatter, taskDirectory, mode } = readTaskIndex(inputPath);
  const current = readTaskDocument(inputPath);
  const allowedFields = new Set<TaskField>(['phase', 'state', 'branch', 'pr', 'ui_url', 'skills', 'app_map', 'expected', 'criteria', 'proposal_state', 'functional_state', 'requirements_fix']);
  const entries = Object.entries(values);
  if (!entries.length) throw new Error('at least one task field is required');
  const candidate = { ...current, ...values };
  const validation = validateDocument('task', candidate);
  if (!validation.valid) {
    throw new Error(`task update is invalid: ${validation.issues.map(issue => `${issue.path} ${issue.message}`).join('; ')}`);
  }
  let updatedFrontmatter = frontmatter;
  for (const [field, value] of entries) {
    if (!allowedFields.has(field as TaskField)) throw new Error(`unsupported task field: ${field}`);
    const keyPattern = new RegExp(`^${field}:[^\\r\\n]*$`, 'gm');
    const matches = [...updatedFrontmatter.matchAll(keyPattern)];
    if (matches.length !== 1) throw new Error(`task index must contain exactly one ${field} field`);
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error(`cannot serialize task field: ${field}`);
    updatedFrontmatter = updatedFrontmatter.replace(keyPattern, `${field}: ${serialized}`);
  }

  const updated = `${updatedFrontmatter}${original.slice(frontmatter.length)}`;
  const temporary = join(taskDirectory, `.${basename(file)}.${randomUUID()}.tmp`);

  try {
    const fd = openSync(temporary, 'wx', mode & 0o777);
    try {
      writeFileSync(fd, updated, 'utf8');
    } finally {
      closeSync(fd);
    }
    if (readFileSync(file, 'utf8') !== original) throw new Error('task index changed concurrently');
    renameSync(temporary, file);
  } finally {
    try { unlinkSync(temporary); } catch { /* already renamed or never created */ }
  }
}

export function runSetter(argv: string[], field: Extract<TaskField, 'phase' | 'state'>, isValid: (value: string) => boolean): void {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(`usage: bun ${field === 'phase' ? 'set-phase' : 'set-state'}.ts <task-index> <${field}>\n`);
    return;
  }
  if (argv.length !== 2) throw new Error(`usage: bun ${field === 'phase' ? 'set-phase' : 'set-state'}.ts <task-index> <${field}>`);
  const [file, value] = argv as [string, string];
  if (!file || !value || !isValid(value)) throw new Error(`invalid ${field}: ${value ?? ''}`);
  updateTaskField(file, field, value);
  process.stdout.write(`${value}\n`);
}

export function cli(main: () => void): void {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
