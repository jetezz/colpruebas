#!/usr/bin/env bun
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { NavigationDocument } from '../../../types/contracts/navigation.ts';
import type { NavigationCriterion } from '../../../types/contracts/shared.ts';
import { NonEmptyTextSchema } from '../../../types/contracts/shared.ts';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import { slugify as slug } from '../../../types/scripts/slugify.ts';

type Dict = Record<string, unknown>;
type Issue = { path: string; message: string };
type Args = { root: string; view?: string; feature?: string; json: boolean; help: boolean };
type NavigationView = NavigationDocument['views'][number];
type NavigationFeature = NavigationView['features'][number];
type View = { value: Dict; index: number; slug: string; features: Feature[] } & NavigationView;
type Feature = { value: Dict; index: number; slug: string; criteria: Criterion[] } & NavigationFeature;
type Criterion = { value: Dict; index: number; slug: string } & NavigationCriterion;

const isDict = (value: unknown): value is Dict => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => NonEmptyTextSchema.safeParse(value).success;

// Slug derivation is canonical: see types/scripts/slugify.ts.

function parseArgs(argv: string[]): Args {
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
  return `Validate docs/app-map against navigation.yaml.

Usage: bun validate-app-map-docs.ts [--root DIR] [--view VIEW_ID] [--feature NAME] [--json]

--root DIR       Project root (default: current directory)
--view ID        Limit validation to one view
--feature NAME   Limit validation to one feature; use --view if ambiguous
--json           Print machine-readable output
--help, -h       Show this help`;
}

function list(dir: string, issues: Issue[]): string[] | null {
  try {
    const stat = lstatSync(dir);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      issues.push({ path: dir, message: 'expected a real directory (symlinks are not followed)' });
      return null;
    }
    return readdirSync(dir).sort();
  } catch {
    issues.push({ path: dir, message: 'directory is missing or unreadable' });
    return null;
  }
}

function checkChildren(dir: string, expected: string[], issues: Issue[], optional: string[] = []) {
  const actual = list(dir, issues);
  if (!actual) return;
  const allowed = new Set([...expected, ...optional]);
  for (const name of expected) {
    if (!actual.includes(name)) issues.push({ path: join(dir, name), message: 'required entry is missing' });
  }
  for (const name of actual) {
    if (!allowed.has(name)) issues.push({ path: join(dir, name), message: 'unexpected entry' });
  }
}

function checkFile(file: string, issues: Issue[], heading?: string, description?: string) {
  try {
    const stat = lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) {
      issues.push({ path: file, message: 'expected a regular file (symlinks are not followed)' });
      return;
    }
    const content = readFileSync(file, 'utf8');
    if (!content.trim()) issues.push({ path: file, message: 'Markdown file must not be empty' });
    const firstLine = content.split(/\r?\n/).find(line => line.trim())?.trim();
    if (heading && firstLine !== `# ${heading}`) issues.push({ path: file, message: `first non-empty line must be "# ${heading}"` });
    if (description) {
      const normalizedContent = content.replace(/\s+/g, ' ').trim();
      const normalizedDescription = description.replace(/\s+/g, ' ').trim();
      if (!normalizedContent.includes(normalizedDescription)) issues.push({ path: file, message: 'must contain the canonical criterion description from navigation.yaml' });
    }
  } catch {
    issues.push({ path: file, message: 'required file is missing or unreadable' });
  }
}

function parseNavigation(raw: unknown, issues: Issue[]): View[] {
  const validation = validateDocument('navigation', raw);
  issues.push(...validation.issues);
  if (!validation.valid) return [];
  return validation.data.views.map((viewRaw, vi) => {
    const viewSlug = slug(viewRaw.id);
    if (!viewSlug) issues.push({ path: `navigation.yaml.views[${vi}].id`, message: 'ID does not produce a valid path slug' });
    const features: Feature[] = viewRaw.features.map((featureRaw, fi) => {
      const featureSlug = slug(featureRaw.name);
      if (!featureSlug) issues.push({ path: `navigation.yaml.views[${vi}].features[${fi}].name`, message: 'name does not produce a valid path slug' });
      const criteria: Criterion[] = featureRaw.criteria.map((criterionRaw, ci) => {
        const criterionSlug = slug(criterionRaw.id);
        if (!criterionSlug) issues.push({ path: `navigation.yaml.views[${vi}].features[${fi}].criteria[${ci}].id`, message: 'ID does not produce a valid path slug' });
        return { ...criterionRaw, value: criterionRaw as unknown as Dict, index: ci, slug: criterionSlug };
      });
      return { ...featureRaw, value: featureRaw as unknown as Dict, index: fi, slug: featureSlug, criteria };
    });
    return { ...viewRaw, value: viewRaw as unknown as Dict, index: vi, slug: viewSlug, features };
  });
}

function checkSlugs(views: View[], issues: Issue[]) {
  const viewSlugs = new Map<string, string>();
  for (const view of views) {
    const path = `navigation.yaml.views[${view.index}].id`;
    const previous = viewSlugs.get(view.slug);
    if (previous) issues.push({ path, message: `view path slug collides with ${previous}: ${view.slug}` });
    else viewSlugs.set(view.slug, path);
    const featureSlugs = new Map<string, string>();
    for (const feature of view.features) {
      const featurePath = `navigation.yaml.views[${view.index}].features[${feature.index}].name`;
      const oldFeature = featureSlugs.get(feature.slug);
      if (oldFeature) issues.push({ path: featurePath, message: `feature path slug collides with ${oldFeature}: ${feature.slug}` });
      else featureSlugs.set(feature.slug, featurePath);
      const criterionSlugs = new Map<string, string>();
      for (const criterion of feature.criteria) {
        const criterionPath = `navigation.yaml.views[${view.index}].features[${feature.index}].criteria[${criterion.index}].id`;
        const oldCriterion = criterionSlugs.get(criterion.slug);
        if (oldCriterion) issues.push({ path: criterionPath, message: `criterion path slug collides with ${oldCriterion}: ${criterion.slug}` });
        else criterionSlugs.set(criterion.slug, criterionPath);
      }
    }
  }
}

function main() {
  let args: Args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`); process.exit(2); }
  if (args.help) { console.log(help()); return; }

  const criteriaScript = resolve(import.meta.dir, '../../criterios/scripts/validate-criteria.ts');
  const criteriaArgs = [criteriaScript, '--root', args.root, '--json'];
  if (args.view) criteriaArgs.push('--view', args.view);
  if (args.feature) criteriaArgs.push('--feature', args.feature);
  const proc = Bun.spawnSync(['bun', ...criteriaArgs], { stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode !== 0) {
    const issue = { path: 'criteria prerequisite', message: (proc.stderr.toString() || proc.stdout.toString() || 'criteria validation failed').trim() };
    if (args.json) console.log(JSON.stringify({ valid: false, scope: args.view ? `view:${args.view}` : 'project', globalStructureChecked: false, issues: [issue] }, null, 2));
    else console.error(`Cannot validate docs until criteria pass: ${issue.message}`);
    process.exit(1);
  }

  const appMap = resolve(args.root, 'docs/app-map');
  const navigationFile = join(appMap, 'navigation.yaml');
  let scope = args.feature ? `feature:${args.feature}` : args.view ? `view:${args.view}` : 'project';
  let parsed: unknown;
  try { parsed = Bun.YAML.parse(readFileSync(navigationFile, 'utf8')); }
  catch (error) {
    const issue = { path: navigationFile, message: error instanceof Error ? `could not read/parse YAML: ${error.message}` : 'could not read/parse YAML' };
    if (args.json) console.log(JSON.stringify({ valid: false, scope, issues: [issue] }, null, 2));
    else console.error(`${navigationFile}: ${issue.message}`);
    process.exit(1);
  }

  const issues: Issue[] = [];
  const allViews = parseNavigation(parsed, issues);
  checkSlugs(allViews, issues);

  let selectedViews = allViews;
  if (args.view !== undefined) {
    selectedViews = allViews.filter(view => view.id === args.view);
    if (selectedViews.length !== 1) {
      issues.push({ path: 'navigation.yaml.views', message: `${selectedViews.length ? 'ambiguous' : 'unknown'} view ID: ${args.view}` });
      selectedViews = [];
    }
  }

  let selectedFeatures = selectedViews.flatMap(view => view.features.map(feature => ({ view, feature })));
  if (args.feature !== undefined) {
    selectedFeatures = allViews.flatMap(view => view.features.filter(feature => feature.name === args.feature).map(feature => ({ view, feature })))
      .filter(item => args.view === undefined || item.view.id === args.view);
    if (selectedFeatures.length !== 1) {
      issues.push({ path: 'navigation.yaml.views', message: `${selectedFeatures.length ? 'ambiguous feature; specify --view' : 'unknown feature'}: ${args.feature}` });
      selectedFeatures = [];
    }
    selectedViews = selectedFeatures.map(item => item.view);
    if (selectedViews.length === 1) scope = `view:${selectedViews[0]!.id}/feature:${args.feature}`;
  }

  const full = args.view === undefined && args.feature === undefined;
  const rootExpected = ['navigation.yaml', ...allViews.map(view => view.slug)];
  if (full) checkChildren(appMap, rootExpected, issues);
  else if (selectedViews.length === 1) {
    const viewDir = join(appMap, selectedViews[0]!.slug);
    const viewStat = (() => { try { return lstatSync(viewDir); } catch { return null; } })();
    if (!viewStat || viewStat.isSymbolicLink() || !viewStat.isDirectory()) issues.push({ path: viewDir, message: 'view directory is missing or invalid' });
  }

  for (const view of selectedViews) {
    const viewDir = join(appMap, view.slug);
    const viewFile = join(viewDir, `${view.slug}.md`);
    const featuresForView = args.feature ? selectedFeatures.filter(item => item.view === view).map(item => item.feature) : view.features;
    if (!args.feature) {
      checkChildren(viewDir, [`${view.slug}.md`, ...view.features.map(feature => feature.slug)], issues, [`${view.slug}.yaml`]);
      checkFile(viewFile, issues, view.name);
    }
    for (const feature of featuresForView) {
      const featureDir = join(viewDir, feature.slug);
      checkChildren(featureDir, feature.criteria.map(criterion => `${criterion.slug}.md`), issues);
      for (const criterion of feature.criteria) {
        checkFile(join(featureDir, `${criterion.slug}.md`), issues, criterion.id, criterion.description);
      }
    }
  }

  if (args.json) console.log(JSON.stringify({ valid: issues.length === 0, scope, globalStructureChecked: full, issues }, null, 2));
  else {
    console.log(`Scope: ${scope}`);
    console.log(`Global structure checked: ${full ? 'yes' : 'no'}`);
    if (!issues.length) console.log('App Map documentation is valid.');
    else {
      console.error(`Found ${issues.length} issue(s):`);
      for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
    }
  }
  process.exit(issues.length ? 1 : 0);
}

main();
