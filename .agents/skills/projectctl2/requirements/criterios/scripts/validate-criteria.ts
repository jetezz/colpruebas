#!/usr/bin/env bun
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import { CriterionTypeSchema, NonEmptyTextSchema } from '../../../types/contracts/shared.ts';

type Dict = Record<string, unknown>;
type Issue = { path: string; message: string };
type Args = { root: string; view?: string; feature?: string; json: boolean; help: boolean };
type Feature = { value: Dict; path: string; parent: Dict };

const isDict = (value: unknown): value is Dict => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => NonEmptyTextSchema.safeParse(value).success;

function argsOf(argv: string[]): Args {
  const result: Args = { root: process.cwd(), json: false, help: false };
  const seen = new Set<string>();
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') { result.help = true; continue; }
    if (arg === '--json') { result.json = true; continue; }
    const match = arg.match(/^(--root|--view|--feature)(?:=(.*))?$/);
    if (!match) throw new Error(`Unknown option: ${arg}`);
    if (seen.has(match[1]!)) throw new Error(`Option supplied more than once: ${match[1]}`);
    seen.add(match[1]!);
    const value = match[2] ?? argv[++i];
    if (!isText(value) || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}`);
    if (match[1] === '--root') result.root = resolve(value);
    else if (match[1] === '--view') result.view = value;
    else result.feature = value;
  }
  return result;
}

function help() {
  return `Validate criteria in docs/app-map/navigation.yaml.

Usage: bun validate-criteria.ts [--root DIR] [--view VIEW_ID] [--feature NAME] [--json]

--root DIR       Project root (default: current directory)
--view ID        Limit validation to one view
--feature NAME   Limit validation to one feature; use --view if ambiguous
--json           Print machine-readable output
--help, -h       Show this help`;
}

function validate(document: unknown, args: Args) {
  const validation = validateDocument('navigation', document);
  const issues: Issue[] = [...validation.issues];
  const full = args.view === undefined && args.feature === undefined;
  let scope = args.feature ? `feature:${args.feature}` : args.view ? `view:${args.view}` : 'project';
  const fail = (path: string, message: string) => issues.push({ path, message });

  const source = validation.valid ? validation.data : document;
  if (!isDict(source)) return { scope, globalUniquenessChecked: full, issues: [{ path: '$', message: 'expected a YAML mapping' }] };
  if (!Array.isArray(source.views)) {
    return { scope, globalUniquenessChecked: full, issues };
  }

  const views = source.views;
  const features: Feature[] = [];
  views.forEach((view, vi) => {
    if (isDict(view) && Array.isArray(view.features)) {
      view.features.forEach((feature, fi) => {
        if (isDict(feature)) features.push({ value: feature, path: `views[${vi}].features[${fi}]`, parent: view });
      });
    }
  });

  let selectedViewIndexes = views.map((_, i) => i);
  let selectedFeatures: Feature[];
  if (args.view !== undefined) {
    const matches = views.map((view, index) => ({ view, index })).filter(x => isDict(x.view) && x.view.id === args.view);
    if (matches.length !== 1) {
      fail('$.views', `${matches.length ? 'ambiguous' : 'unknown'} view ID: ${args.view}`);
      return { scope, globalUniquenessChecked: full, issues };
    }
    selectedViewIndexes = [matches[0]!.index];
  }

  selectedFeatures = features.filter(feature => {
    const vi = views.indexOf(feature.parent);
    return selectedViewIndexes.includes(vi);
  });
  if (args.feature !== undefined) {
    selectedFeatures = features.filter(feature => feature.value.name === args.feature &&
      (args.view === undefined || feature.parent.id === args.view));
    if (selectedFeatures.length !== 1) {
      fail('$.views', `${selectedFeatures.length ? 'ambiguous feature; specify --view' : 'unknown feature'}: ${args.feature}`);
      return { scope, globalUniquenessChecked: full, issues };
    }
    selectedViewIndexes = [views.indexOf(selectedFeatures[0]!.parent)];
    const parentId = selectedFeatures[0]!.parent.id;
    scope = `view:${isText(parentId) ? parentId : '<invalid>'}/feature:${args.feature}`;
  }

  const viewIds = new Map<string, string>();
  const criterionIds = new Map<string, string>();
  for (const vi of selectedViewIndexes) {
    const path = `views[${vi}]`;
    const view = views[vi];
    if (!isDict(view)) continue;
    if (isText(view.id)) {
      const previous = viewIds.get(view.id);
      if (previous) fail(`${path}.id`, `duplicate view ID; first used at ${previous}`);
      else viewIds.set(view.id, `${path}.id`);
    }
  }

  for (const feature of selectedFeatures) {
    const { value, path, parent } = feature;
    if (!args.feature && typeof value.name === 'string' && selectedFeatures.some(other =>
      other !== feature && other.parent === parent && other.value.name === value.name &&
      Number(other.path.match(/features\[(\d+)\]/)?.[1]) < Number(path.match(/features\[(\d+)\]/)?.[1]))) {
      fail(`${path}.name`, 'feature names must be unique within a view');
    }
    if (!Array.isArray(value.criteria)) continue;

    value.criteria.forEach((criterion, ci) => {
      const cpath = `${path}.criteria[${ci}]`;
      if (!isDict(criterion)) return;
      if (isText(criterion.id)) {
        const previous = criterionIds.get(criterion.id);
        if (previous) fail(`${cpath}.id`, `duplicate criterion ID; first used at ${previous}`);
        else criterionIds.set(criterion.id, `${cpath}.id`);
        const conflictingView = viewIds.get(criterion.id);
        if (conflictingView) fail(`${cpath}.id`, `criterion ID collides with view ID at ${conflictingView}`);
      }
      if (!CriterionTypeSchema.safeParse(criterion.type).success) {
        fail(`${cpath}.type`, `must be one of: ${CriterionTypeSchema.options.join(', ')}`);
      }
    });
  }

  if (!args.feature) {
    for (const vi of selectedViewIndexes) {
      const view = views[vi];
      if (!isDict(view) || !isText(view.name) || !Array.isArray(view.features)) continue;
      const hasOwnFeature = view.features.some(feature => isDict(feature) && feature.name === view.name);
      if (!hasOwnFeature) fail(`views[${vi}].features`, 'must include a feature whose name exactly matches the view name');
    }
  }

  return { scope, globalUniquenessChecked: full, issues };
}

function main() {
  let args: Args;
  try { args = argsOf(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`); process.exit(2); }
  if (args.help) { console.log(help()); return; }

  const file = resolve(args.root, 'docs/app-map/navigation.yaml');
  let document: unknown;
  try { document = Bun.YAML.parse(readFileSync(file, 'utf8')); }
  catch (error) {
    const issue = { path: file, message: error instanceof Error ? `could not read/parse YAML: ${error.message}` : 'could not read/parse YAML' };
    const scope = args.feature ? `feature:${args.feature}` : args.view ? `view:${args.view}` : 'project';
    if (args.json) console.log(JSON.stringify({ valid: false, scope, globalUniquenessChecked: !args.view && !args.feature, issues: [issue] }, null, 2));
    else console.error(`${file}: ${issue.message}`);
    process.exit(1);
  }

  const result = validate(document, args);
  if (args.json) console.log(JSON.stringify({ valid: result.issues.length === 0, ...result }, null, 2));
  else {
    console.log(`Scope: ${result.scope}`);
    console.log(`Global uniqueness checked: ${result.globalUniquenessChecked ? 'yes' : 'no'}`);
    if (!result.issues.length) console.log('Criteria navigation is valid.');
    else {
      console.error(`Found ${result.issues.length} issue(s):`);
      for (const issue of result.issues) console.error(`- ${issue.path}: ${issue.message}`);
    }
  }
  process.exit(result.issues.length ? 1 : 0);
}

main();
