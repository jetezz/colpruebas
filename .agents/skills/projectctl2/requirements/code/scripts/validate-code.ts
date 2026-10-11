#!/usr/bin/env bun
import * as ts from 'typescript';
import { lstatSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve, isAbsolute } from 'node:path';
import { loadStructure, type MappedPath } from '../../estructura/scripts/structure-contract.ts';
import type { NavigationDocument } from '../../../types/contracts/navigation.ts';
import type { NavigationCriterion } from '../../../types/contracts/shared.ts';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';

// Canonical view type derived from the contract (no hierarchy redefinition).
type NavigationView = NavigationDocument['views'][number];
// Scoped criterion: canonical id + parent scope for --view/--feature filtering.
type ScopedCriterion = Pick<NavigationCriterion, 'id'> & { viewId: string; featureName: string };
type Issue = { path: string; criterionId?: string; message: string };
type Args = { root: string; view?: string; feature?: string; json: boolean; help: boolean };

const SOURCE_KINDS = new Map<string, ts.ScriptKind>([
  ['.ts', ts.ScriptKind.TS], ['.tsx', ts.ScriptKind.TSX], ['.js', ts.ScriptKind.JS], ['.jsx', ts.ScriptKind.JSX],
  ['.mts', ts.ScriptKind.TS], ['.cts', ts.ScriptKind.TS], ['.mjs', ts.ScriptKind.JS], ['.cjs', ts.ScriptKind.JS],
]);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage', '.next', 'vendor']);

function parseArgs(argv: string[]): Args {
  const args: Args = { root: process.cwd(), json: false, help: false };
  const seen = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') { args.help = true; continue; }
    if (arg === '--json') { args.json = true; continue; }
    const match = arg.match(/^(--root|--view|--feature)(?:=(.*))?$/);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    if (seen.has(match[1]!)) throw new Error(`Option supplied more than once: ${match[1]}`);
    seen.add(match[1]!);
    const value = match[2] ?? argv[++i];
    if (!value?.trim() || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}`);
    if (match[1] === '--root') args.root = resolve(value);
    else if (match[1] === '--view') args.view = value;
    else args.feature = value;
  }
  return args;
}

function help() {
  return `Validate @<criterion-id> comment markers in mapped code paths.

Usage: bun validate-code.ts [--root DIR] [--view VIEW_ID] [--feature NAME] [--json]

--root DIR       Project root (default: current directory)
--view ID        Limit validation to one view
--feature NAME   Limit validation to one feature; use --view if ambiguous
--json           Print machine-readable output
--help, -h       Show this help`;
}

function runStructurePreflight(root: string): string | undefined {
  const checker = resolve(import.meta.dir, '../../estructura/scripts/check-paths.ts');
  const proc = Bun.spawnSync(['bun', checker, '--root', root, '--json'], { stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode === 0) return undefined;
  return (proc.stderr.toString() || proc.stdout.toString() || 'structure/path validation failed').trim();
}

function loadNavigation(root: string): NavigationView[] {
  const file = resolve(root, 'docs/app-map/navigation.yaml');
  const document = Bun.YAML.parse(readFileSync(file, 'utf8'));
  const validation = validateDocument('navigation', document);
  if (!validation.valid) throw new Error(validation.issues.map(issue => `${issue.path}: ${issue.message}`).join('; '));
  return validation.data.views;
}

function scopeCriteria(views: NavigationView[], args: Args): { selected: ScopedCriterion[]; issue?: Issue; scope: string } {
  let selectedViews = views;
  if (args.view !== undefined) {
    selectedViews = views.filter(view => view.id === args.view);
    if (selectedViews.length !== 1) {
      return { selected: [], scope: `view:${args.view}`, issue: { path: 'docs/app-map/navigation.yaml', message: `${selectedViews.length ? 'ambiguous' : 'unknown'} view ID: ${args.view}` } };
    }
  }
  if (args.feature !== undefined) {
    const matches = selectedViews.flatMap(view => view.features.filter(feature => feature.name === args.feature).map(feature => ({ view, feature })));
    if (matches.length === 0) {
      return { selected: [], scope: `feature:${args.feature}`, issue: { path: 'docs/app-map/navigation.yaml', message: `unknown feature: ${args.feature}` } };
    }
    const owners = [...new Set(matches.map(item => item.view.id))];
    if (owners.length > 1) {
      return { selected: [], scope: `feature:${args.feature}`, issue: { path: 'docs/app-map/navigation.yaml', message: `feature name is ambiguous; specify --view: ${args.feature}` } };
    }
    const selected = matches.flatMap(item => item.feature.criteria.map(criterion => ({ id: criterion.id, viewId: item.view.id, featureName: item.feature.name })));
    const scope = `view:${matches[0]!.view.id}/feature:${args.feature}`;
    return { selected, scope };
  }
  const selected = selectedViews.flatMap(view => view.features.flatMap(feature => feature.criteria.map(criterion => ({ id: criterion.id, viewId: view.id, featureName: feature.name }))));
  const scope = args.view ? `view:${args.view}` : 'project';
  return { selected, scope };
}

function markerIdsInComment(comment: string): string[] {
  let body = comment;
  if (body.startsWith('//')) body = body.slice(2);
  else if (body.startsWith('/*')) body = body.slice(2).replace(/\*\/$/, '');
  else return [];
  return body.split(/\r?\n/).map(line => line.trim().replace(/^\*\s?/, '').trim())
    .map(line => /^@([A-Za-z0-9][A-Za-z0-9_-]*)$/.exec(line)?.[1])
    .filter((id): id is string => id !== undefined);
}

function commentMarkers(file: string): Set<string> {
  const extension = extname(file).toLowerCase();
  const scriptKind = SOURCE_KINDS.get(extension);
  if (scriptKind === undefined) throw new Error(`unsupported source language for comment parsing: ${extension || '<no extension>'}`);
  const source = readFileSync(file, 'utf8');
  const variant = extension === '.tsx' || extension === '.jsx' ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, variant, source, undefined, 0, source.length);
  const markers = new Set<string>();
  for (let kind = scanner.scan(); kind !== ts.SyntaxKind.EndOfFileToken; kind = scanner.scan()) {
    if (kind !== ts.SyntaxKind.SingleLineCommentTrivia && kind !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
    for (const id of markerIdsInComment(scanner.getTokenText())) markers.add(id);
  }
  return markers;
}

function sourceFiles(path: string): string[] {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) throw new Error(`symlink is not allowed: ${path}`);
  if (stat.isFile()) {
    if (!SOURCE_KINDS.has(extname(path).toLowerCase())) throw new Error(`unsupported source language for comment parsing: ${path}`);
    return [path];
  }
  if (!stat.isDirectory()) throw new Error(`mapped path is not a file or directory: ${path}`);
  const files: string[] = [];
  const pending = [path];
  let visited = 0;
  while (pending.length) {
    const current = pending.pop()!;
    if (++visited > 20000) throw new Error(`directory scan budget exceeded: ${path}`);
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`symlink is not allowed: ${join(current, entry.name)}`);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) pending.push(join(current, entry.name));
      } else if (entry.isFile() && SOURCE_KINDS.has(extname(entry.name).toLowerCase())) {
        files.push(join(current, entry.name));
      }
    }
  }
  if (!files.length) throw new Error(`no supported JS/TS source files under: ${path}`);
  return files.sort();
}

function main() {
  let args: Args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`); process.exit(2); }
  if (args.help) { console.log(help()); return; }

  const prerequisiteError = runStructurePreflight(args.root);
  if (prerequisiteError) {
    if (args.json) console.log(JSON.stringify({ valid: false, scope: 'project', issues: [{ path: 'structure prerequisite', message: prerequisiteError }] }, null, 2));
    else console.error(`Cannot validate code until structure and paths pass: ${prerequisiteError}`);
    process.exit(1);
  }

  try {
    const views = loadNavigation(args.root);
    const criteria = views.flatMap(view => view.features.flatMap(feature => feature.criteria));
    const knownIds = new Set(criteria.map(criterion => criterion.id));
    const scoped = scopeCriteria(views, args);
    const issues: Issue[] = scoped.issue ? [scoped.issue] : [];
    const structure = loadStructure(args.root);
    if (structure.issues.length) issues.push(...structure.issues);
    const mappedById = new Map<string, MappedPath[]>();
    for (const path of structure.paths) {
      const list = mappedById.get(path.criterionId) ?? [];
      list.push(path);
      mappedById.set(path.criterionId, list);
    }

    const cache = new Map<string, Set<string>>();
    for (const criterion of scoped.selected) {
      const mappings = mappedById.get(criterion.id) ?? [];
      if (!mappings.length) {
        issues.push({ path: 'criteria-map.yaml', criterionId: criterion.id, message: 'criterion has no code path; assign paths in its type map before validation' });
        continue;
      }
      for (const mapping of mappings) {
        const target = resolve(args.root, ...mapping.path.split('/'));
        let files: string[];
        try { files = sourceFiles(target); }
        catch (error) {
          issues.push({ path: mapping.path, criterionId: criterion.id, message: error instanceof Error ? error.message : String(error) });
          continue;
        }
        let foundInPath = false;
        for (const file of files) {
          let markers = cache.get(file);
          if (!markers) { markers = commentMarkers(file); cache.set(file, markers); }
          for (const marker of markers) {
            if (!knownIds.has(marker)) {
              issues.push({ path: relative(args.root, file), criterionId: marker, message: `unknown criterion marker @${marker}` });
            }
          }
          if (markers.has(criterion.id)) foundInPath = true;
        }
        if (!foundInPath) {
          issues.push({ path: mapping.path, criterionId: criterion.id, message: `no real code comment marker @${criterion.id} found in mapped path` });
        }
      }
    }

    const result = {
      valid: issues.length === 0,
      scope: scoped.scope,
      checkedCriteria: scoped.selected.length,
      checkedPaths: scoped.selected.reduce((total, criterion) => total + (mappedById.get(criterion.id)?.length ?? 0), 0),
      issues,
    };
    if (args.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Scope: ${result.scope}`);
      if (!issues.length) console.log(`All ${result.checkedCriteria} criterion marker(s) found in ${result.checkedPaths} mapped path(s).`);
      else {
        console.error(`Found ${issues.length} issue(s):`);
        for (const issue of issues) console.error(`- ${issue.path}${issue.criterionId ? ` [${issue.criterionId}]` : ''}: ${issue.message}`);
      }
    }
    process.exit(issues.length ? 1 : 0);
  } catch (error) {
    const issue = { path: 'code validation', message: error instanceof Error ? error.message : String(error) };
    if (args.json) console.log(JSON.stringify({ valid: false, scope: args.view ? `view:${args.view}` : 'project', issues: [issue] }, null, 2));
    else console.error(issue.message);
    process.exit(1);
  }
}

main();
