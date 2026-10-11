#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isText, loadNavigation, readYaml, slug, testFile, validateViewTestData, type Issue } from './test-contract.ts';

type Args = { root: string; view?: string; json: boolean; help: boolean };

function parseArgs(argv: string[]): Args {
  const result: Args = { root: process.cwd(), json: false, help: false };
  const seen = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') { result.help = true; continue; }
    if (arg === '--json') { result.json = true; continue; }
    const match = arg.match(/^(--root|--view)(?:=(.*))?$/);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    if (seen.has(match[1]!)) throw new Error(`Option supplied more than once: ${match[1]}`);
    seen.add(match[1]!);
    const value = match[2] ?? argv[++i];
    if (!isText(value) || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}`);
    if (match[1] === '--root') result.root = resolve(value);
    else result.view = value;
  }
  return result;
}

function help() {
  return `Validate per-view test YAML against docs/app-map/navigation.yaml.

Usage: bun validate-tests.ts [--root DIR] [--view VIEW_ID] [--json]

--root DIR       Project root (default: current directory)
--view ID        Limit validation to one view
--json           Print machine-readable output
--help, -h       Show this help`;
}

function main() {
  let args: Args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`); process.exit(2); }
  if (args.help) { console.log(help()); return; }

  const docsScript = resolve(import.meta.dir, '../../docs/scripts/validate-app-map-docs.ts');
  const docsArgs = [docsScript, '--root', args.root, '--json'];
  if (args.view) docsArgs.push('--view', args.view);
  const proc = Bun.spawnSync(['bun', ...docsArgs], { stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode !== 0) {
    const issue = { path: 'docs prerequisite', message: (proc.stderr.toString() || proc.stdout.toString() || 'docs validation failed').trim() };
    if (args.json) console.log(JSON.stringify({ valid: false, scope: args.view ? `view:${args.view}` : 'project', globalStructureChecked: false, issues: [issue] }, null, 2));
    else console.error(`Cannot validate tests until docs and criteria pass: ${issue.message}`);
    process.exit(1);
  }

  let views;
  try { views = loadNavigation(args.root); }
  catch (error) {
    const issue = { path: 'docs/app-map/navigation.yaml', message: error instanceof Error ? error.message : String(error) };
    if (args.json) console.log(JSON.stringify({ valid: false, scope: 'project', globalStructureChecked: !args.view, issues: [issue] }, null, 2));
    else console.error(issue.message);
    process.exit(1);
  }

  const issues: Issue[] = [];
  const viewSlugs = new Map<string, string>();
  for (const view of views) {
    const previous = viewSlugs.get(view.slug);
    if (previous) issues.push({ path: `navigation.yaml.views.${view.id}`, message: `view path slug collides with ${previous}: ${view.slug}` });
    else viewSlugs.set(view.slug, view.id);
  }

  let selected = views;
  if (args.view !== undefined) {
    selected = views.filter(view => view.id === args.view);
    if (selected.length !== 1) {
      issues.push({ path: 'navigation.yaml.views', message: `${selected.length ? 'ambiguous' : 'unknown'} view ID: ${args.view}` });
      selected = [];
    }
  }

  for (const view of selected) {
    const file = testFile(args.root, view);
    if (!existsSync(file)) {
      issues.push({ path: file, message: 'test YAML is missing for this view' });
      continue;
    }
    try {
      issues.push(...validateViewTestData(view, readYaml(file), file));
    } catch (error) {
      issues.push({ path: file, message: error instanceof Error ? `could not read/parse YAML: ${error.message}` : 'could not read/parse YAML' });
    }
  }

  const scope = args.view ? `view:${args.view}` : 'project';
  const full = args.view === undefined;
  if (args.json) console.log(JSON.stringify({ valid: issues.length === 0, scope, globalStructureChecked: full, issues }, null, 2));
  else {
    console.log(`Scope: ${scope}`);
    console.log(`Global structure checked: ${full ? 'yes' : 'no'}`);
    if (!issues.length) console.log('Test records match navigation.yaml.');
    else {
      console.error(`Found ${issues.length} issue(s):`);
      for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
    }
  }
  process.exit(issues.length ? 1 : 0);
}

main();
