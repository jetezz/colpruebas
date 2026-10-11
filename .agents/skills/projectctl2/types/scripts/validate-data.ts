#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { SCHEMA_FILES, validateSchemaData, type SchemaName } from './schema-validator.ts';

function usage() {
  return `Validate a parsed YAML/JSON document against a projectctl2 shared schema. For --schema task, PATH may be a Markdown task index; only its YAML frontmatter is validated.\n\nUsage: bun validate-data.ts --schema <${Object.keys(SCHEMA_FILES).join('|')}> --file <PATH>\n\nThe schema validates document shape only; cross-document and filesystem rules belong to the owning validator.`;
}

function parseArgs(args: string[]): { schema?: SchemaName; file?: string; help: boolean } {
  const result: { schema?: SchemaName; file?: string; help: boolean } = { help: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--help' || arg === '-h') { result.help = true; continue; }
    const match = arg.match(/^(--schema|--file)(?:=(.*))?$/);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    const value = match[2] ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}.`);
    if (match[1] === '--schema') {
      if (!Object.hasOwn(SCHEMA_FILES, value)) throw new Error(`Unknown schema: ${value}.`);
      if (result.schema) throw new Error('--schema may only be provided once.');
      result.schema = value as SchemaName;
    } else {
      if (result.file) throw new Error('--file may only be provided once.');
      result.file = value;
    }
  }
  if (!result.help && (!result.schema || !result.file)) throw new Error('Both --schema and --file are required.');
  return result;
}

function main() {
  let args: ReturnType<typeof parseArgs>;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${usage()}`); process.exit(2); }
  if (args.help) { console.log(usage()); return; }

  const file = resolve(args.file!);
  try {
    const raw = readFileSync(file, 'utf8');
    const taskFrontmatter = args.schema === 'task' && file.endsWith('.md')
      ? /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(raw)?.[1]
      : undefined;
    if (args.schema === 'task' && file.endsWith('.md') && taskFrontmatter === undefined) throw new Error('task index has invalid frontmatter');
    const data = taskFrontmatter !== undefined
      ? Bun.YAML.parse(taskFrontmatter) as unknown
      : basename(file).endsWith('.json')
        ? JSON.parse(raw) as unknown
        : Bun.YAML.parse(raw) as unknown;
    const issues = validateSchemaData(args.schema!, data);
    if (issues.length) {
      console.error(`${file}: invalid ${args.schema} document`);
      for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
      process.exitCode = 1;
      return;
    }
    console.log(`${file}: valid ${args.schema} shape.`);
  } catch (error) {
    console.error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (import.meta.main) main();
