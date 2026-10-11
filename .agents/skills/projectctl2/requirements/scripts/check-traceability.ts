#!/usr/bin/env bun
import { lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateDocument } from '../../types/scripts/schema-validator.ts';
import { slugify } from '../../types/scripts/slugify.ts';

type Issue = { path: string; message: string; criterionId?: string };
type Args = { root: string; view?: string; feature?: string; json: boolean; help: boolean };

// All slug derivations use the canonical slugify lib (MVP-1). Never reimplement.
const slug = (value: string): string => slugify(value);

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
    if (value === undefined || !value.trim() || value.startsWith('--')) throw new Error(`Missing value for ${match[1]}`);
    if (match[1] === '--root') result.root = resolve(value);
    else if (match[1] === '--view') result.view = value;
    else result.feature = value;
  }
  return result;
}

function help(): string {
  return `Check traceability join across navigation, docs, maps, paths, markers and tests.

Convention: docs/app-map/navigation.yaml is truth. Docs live at
docs/app-map/<view-slug>/<view-slug>.md + <feat-slug>/<crit-slug>.md, where every
slug uses the canonical slugify (NFKD, lowercase, [^a-z0-9]+ to '-', trim).
Maps live at <type>/criteria-map.yaml (frontend, backend, data, tooling, utils)
with project-relative POSIX paths (no absolute, no .., no backslash, no globs);
paths: [] means unassigned. Tests live at docs/app-map/<view-slug>/<view-slug>.yaml
in block style with type PW-AUTO|UNIT and status sin-test|rojo|verde. Code markers
are exact @<ID> alone on a native comment line (case-sensitive, never strings,
under a mapped path, JS-family TS scanner only: ts tsx js jsx mts cts mjs cjs).

Usage: bun check-traceability.ts [--root DIR] [--view ID] [--feature NAME] [--json]

--root DIR       Project root (default: current directory)
--view ID        Limit the verdict to one navigation view id
--feature NAME   Limit the verdict to one feature name; add --view when ambiguous
--json           Print machine-readable output
--help, -h       Show this help

Scope semantics: no --view/--feature runs a global check that certifies
uniqueness and full structure. Any --view/--feature runs a scoped check: the
scoped verdict covers only the selected slice and never certifies global
uniqueness; globalHint reports global-only concerns observed while scoped.
Quirks: structure validators accept no scope flags (this script runs them
global and filters their JSON by view/feature); tests accept no --feature
(this script runs per-view and filters in-YAML); --feature without --view that
matches more than one view is a usage error (exit 2).

Exits: 0 valid in scope, 1 validation failure in scope, 2 usage error.`;
}

type NavCriterion = { id: string; description: string; type: string };
type NavFeature = { name: string; criteria: NavCriterion[] };
type NavView = { id: string; name: string; features: NavFeature[] };

function loadNavigation(root: string): { views: NavView[] | null; issue: Issue | null } {
  const file = resolve(root, 'docs/app-map/navigation.yaml');
  let parsed: unknown;
  try {
    parsed = Bun.YAML.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    return { views: null, issue: { path: file, message: `could not read/parse YAML: ${error instanceof Error ? error.message : String(error)}` } };
  }
  const validation = validateDocument('navigation', parsed);
  if (!validation.valid) {
    return { views: null, issue: { path: file, message: validation.issues.map(i => `${i.path}: ${i.message}`).join('; ') || 'invalid navigation.yaml' } };
  }
  const views = validation.data.views.map(v => ({
    id: v.id,
    name: v.name,
    features: v.features.map(f => ({
      name: f.name,
      criteria: f.criteria.map(c => ({ id: c.id, description: c.description, type: c.type })),
    })),
  }));
  return { views, issue: null };
}

function runValidator(label: string, script: string, root: string, extra: string[]): { valid: boolean; issues: Issue[]; exitCode: number } {
  const proc = Bun.spawnSync(['bun', script, '--root', root, '--json', ...extra], { stdout: 'pipe', stderr: 'pipe' });
  const out = proc.stdout.toString();
  try {
    const parsed = JSON.parse(out || 'null') as { valid?: boolean; issues?: Issue[] };
    const issues = Array.isArray(parsed?.issues) ? parsed.issues : [];
    const valid = parsed?.valid === true && issues.length === 0;
    return { valid, issues, exitCode: proc.exitCode ?? 1 };
  } catch {
    const err = (proc.stderr.toString() || out || 'validator produced no JSON').trim();
    return { valid: false, issues: [{ path: `${label} validator`, message: err }], exitCode: proc.exitCode ?? 1 };
  }
}

const tag = (label: string, issues: Issue[]): Issue[] =>
  issues.map(i => ({ ...i, message: `[${label}] ${i.message}` }));

function mentionsScope(issue: Issue, needles: string[]): boolean {
  const hay = `${issue.path} ${issue.message}`;
  return needles.some(n => n.length > 0 && hay.includes(n));
}

function main(): void {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`);
    process.exit(2);
  }
  if (args.help) {
    console.log(help());
    return;
  }
  const root = resolve(args.root);

  const nav = loadNavigation(root);
  const views = nav.views;

  // Resolve scope. --feature without --view that matches several views is usage error (exit 2).
  let scope: { mode: 'global' | 'scoped'; view?: string; feature?: string };
  let resolvedView: string | undefined = args.view;
  if (args.view === undefined && args.feature === undefined) {
    scope = { mode: 'global' };
  } else if (args.feature !== undefined && args.view === undefined && views !== null) {
    const owners = views.filter(v => v.features.some(f => f.name === args.feature));
    if (owners.length > 1) {
      const msg = `ambiguous feature; specify --view: ${args.feature}`;
      if (args.json) {
        console.log(JSON.stringify({ valid: false, scope: { mode: 'scoped', feature: args.feature }, scopedVerdict: false, globalHint: msg, issues: [{ path: 'docs/app-map/navigation.yaml', message: msg }], coverage: { views: 0, features: 0, criteria: 0, docsFiles: 0, mappedPaths: 0, markersFound: 0, tests: { total: 0, verde: 0, rojo: 0, sinTest: 0 } } }, null, 2));
      } else {
        console.error(msg);
      }
      process.exit(2);
    }
    if (owners.length === 1) {
      resolvedView = owners[0]!.id;
      scope = { mode: 'scoped', view: resolvedView, feature: args.feature };
    } else {
      scope = { mode: 'scoped', feature: args.feature };
    }
  } else if (args.view !== undefined && args.feature !== undefined) {
    scope = { mode: 'scoped', view: args.view, feature: args.feature };
  } else if (args.view !== undefined) {
    scope = { mode: 'scoped', view: args.view };
  } else {
    scope = { mode: 'scoped', feature: args.feature! };
  }

  const dir = import.meta.dir;
  const criteriaScript = resolve(dir, '../criterios/scripts/validate-criteria.ts');
  const docsScript = resolve(dir, '../docs/scripts/validate-app-map-docs.ts');
  const structureScript = resolve(dir, '../estructura/scripts/validate-structure.ts');
  const pathsScript = resolve(dir, '../estructura/scripts/check-paths.ts');
  const codeScript = resolve(dir, '../code/scripts/validate-code.ts');
  const testsScript = resolve(dir, '../test/scripts/validate-tests.ts');

  const viewFeatureArgs: string[] = [];
  if (args.view) viewFeatureArgs.push('--view', args.view);
  if (args.feature) viewFeatureArgs.push('--feature', args.feature);
  const testsArgs: string[] = [];
  if (resolvedView) testsArgs.push('--view', resolvedView);

  const criteria = runValidator('criteria', criteriaScript, root, viewFeatureArgs);
  const docs = runValidator('docs', docsScript, root, viewFeatureArgs);
  const structure = runValidator('structure', structureScript, root, []);
  const paths = runValidator('paths', pathsScript, root, []);
  const code = runValidator('code', codeScript, root, viewFeatureArgs);
  const tests = runValidator('tests', testsScript, root, testsArgs);

  const issues: Issue[] = [];
  const globalOnly: Issue[] = [];
  if (nav.issue) issues.push({ path: nav.issue.path, message: `[join] ${nav.issue.message}` });
  issues.push(...tag('criteria', criteria.issues));
  issues.push(...tag('docs', docs.issues));
  issues.push(...tag('code', code.issues));
  // Tests validator runs per-view; in-YAML feature filtering happens in the join below.
  // Keep view-level test issues as scoped (fail closed); sibling-feature extras surface via join.
  issues.push(...tag('tests', tests.issues));

  // Scoped needles for filtering global structure/paths JSON by view/feature.
  let scopedCriteria: { viewId: string; featureName: string; id: string; type: string; description: string }[] = [];
  let scopedViews: NavView[] = [];
  if (views !== null) {
    scopedViews = views.filter(v => (scope.view === undefined || v.id === scope.view));
    if (scope.view !== undefined && scope.feature !== undefined) {
      scopedViews = scopedViews.map(v => ({ ...v, features: v.features.filter(f => f.name === scope.feature) }));
    } else if (scope.view === undefined && scope.feature !== undefined) {
      scopedViews = scopedViews.map(v => ({ ...v, features: v.features.filter(f => f.name === scope.feature) })).filter(v => v.features.length > 0);
    }
    for (const v of scopedViews) {
      for (const f of v.features) {
        for (const c of f.criteria) scopedCriteria.push({ viewId: v.id, featureName: f.name, id: c.id, type: c.type, description: c.description });
      }
    }
    if (scope.mode === 'scoped' && scopedViews.length === 0 && views !== null) {
      const knownViews = views.map(v => v.id).join(', ');
      issues.push({ path: 'docs/app-map/navigation.yaml', message: `[join] unknown scope: no navigation matches view=${scope.view ?? '-'} feature=${scope.feature ?? '-'} (views: ${knownViews || 'none'})` });
    }
  }

  const needles = Array.from(new Set([
    ...scopedCriteria.flatMap(c => [c.viewId, c.featureName, c.id, slug(c.viewId), slug(c.featureName), slug(c.id), c.type]),
    ...(scope.view ? [scope.view, slug(scope.view)] : []),
    ...(scope.feature ? [scope.feature, slug(scope.feature)] : []),
  ]));

  if (scope.mode === 'global') {
    issues.push(...tag('structure', structure.issues));
    issues.push(...tag('paths', paths.issues));
  } else {
    for (const i of structure.issues) {
      if (mentionsScope(i, needles)) issues.push({ ...i, message: `[structure] ${i.message}` });
      else globalOnly.push({ ...i, message: `[structure] ${i.message}` });
    }
    for (const i of paths.issues) {
      if (mentionsScope(i, needles)) issues.push({ ...i, message: `[paths] ${i.message}` });
      else globalOnly.push({ ...i, message: `[paths] ${i.message}` });
    }
  }

  // Own join checks: navigation IDs -> docs files -> maps entries (presence;
  // order/type already covered by the structure validator) -> paths existence
  // -> markers (via the code validator as single source of truth, no TS
  // scanner duplication) -> tests IDs/status (in-YAML filtering).
  const joinIssues: Issue[] = [];
  let docsFound = 0;
  let mappedPathsTotal = 0;
  const testsStatus = { total: 0, verde: 0, rojo: 0, sinTest: 0 };
  const codeIssueById = new Map<string, Issue[]>();
  for (const i of code.issues) {
    const key = (i as Issue).criterionId ?? '';
    if (key) {
      const list = codeIssueById.get(key) ?? [];
      list.push(i as Issue);
      codeIssueById.set(key, list);
    }
  }
  // Load per-type maps once for presence checks.
  const mapsByType = new Map<string, unknown>();
  for (const area of ['frontend', 'backend', 'data', 'tooling', 'utils']) {
    try {
      mapsByType.set(area, Bun.YAML.parse(readFileSync(join(root, area, 'criteria-map.yaml'), 'utf8')));
    } catch {
      mapsByType.set(area, null);
    }
  }
  const mapHas = (type: string, viewId: string, featureName: string, criterionId: string): { found: boolean; paths: string[] } => {
    const doc = mapsByType.get(type) as { views?: { id?: string; features?: { name?: string; criteria?: { id?: string; paths?: unknown }[] }[] }[] } | null;
    if (!doc || !Array.isArray(doc.views)) return { found: false, paths: [] };
    for (const v of doc.views) {
      if (v?.id !== viewId) continue;
      for (const f of v.features ?? []) {
        if (f?.name !== featureName) continue;
        for (const c of f.criteria ?? []) {
          if (c?.id === criterionId) {
            const pathsList = Array.isArray(c.paths) ? (c.paths as unknown[]).filter((p): p is string => typeof p === 'string') : [];
            return { found: true, paths: pathsList };
          }
        }
      }
    }
    return { found: false, paths: [] };
  };
  // Load per-view test YAML once for in-YAML feature filtering and coverage.
  const testDocs = new Map<string, { features: { name: string; ids: { id: string; status: string }[] }[] } | null>();
  const testFileFor = (viewId: string): string => join(root, 'docs/app-map', slug(viewId), `${slug(viewId)}.yaml`);
  const loadTestDoc = (viewId: string) => {
    if (testDocs.has(viewId)) return testDocs.get(viewId);
    let parsed: { features: { name: string; ids: { id: string; status: string }[] }[] } | null = null;
    try {
      const raw = Bun.YAML.parse(readFileSync(testFileFor(viewId), 'utf8')) as { features?: { name?: string; criteria?: { id?: string; test?: { status?: string } }[] }[] };
      if (raw && Array.isArray(raw.features)) {
        parsed = {
          features: raw.features.filter(f => typeof f?.name === 'string').map(f => ({
            name: f.name as string,
            ids: Array.isArray(f.criteria) ? f.criteria.filter(c => typeof c?.id === 'string').map(c => ({ id: c.id as string, status: typeof c.test?.status === 'string' ? (c.test.status as string) : '' })) : [],
          })),
        };
      }
    } catch {
      parsed = null;
    }
    testDocs.set(viewId, parsed);
    return parsed;
  };

  const markerOkById = new Map<string, boolean>();
  if (views !== null) {
    for (const c of scopedCriteria) {
      const viewSlug = slug(c.viewId);
      const featSlug = slug(c.featureName);
      const critSlug = slug(c.id);
      if (!viewSlug || !featSlug || !critSlug) {
        joinIssues.push({ path: 'docs/app-map/navigation.yaml', message: `[join] ID does not produce a valid path slug: ${!viewSlug ? c.viewId : !featSlug ? c.featureName : c.id}` });
        continue;
      }
      const critFile = join(root, 'docs', 'app-map', viewSlug, featSlug, `${critSlug}.md`);
      try {
        const stat = lstatSync(critFile);
        if (stat.isSymbolicLink() || !stat.isFile()) joinIssues.push({ path: critFile, message: `[join] docs file missing for ${c.id}: ${critFile}` });
        else docsFound += 1;
      } catch {
        joinIssues.push({ path: critFile, message: `[join] docs file missing for ${c.id}: ${critFile}` });
      }
      const mapped = mapHas(c.type, c.viewId, c.featureName, c.id);
      if (!mapped.found) {
        joinIssues.push({ path: join(root, c.type, 'criteria-map.yaml'), message: `[join] maps entry missing for ${c.id} in ${c.type}/criteria-map.yaml (view ${c.viewId}, feature ${c.featureName})` });
      } else if (mapped.paths.length === 0) {
        joinIssues.push({ path: join(root, c.type, 'criteria-map.yaml'), message: `[join] criterion ${c.id} has no mapped paths (unassigned)` });
      } else {
        mappedPathsTotal += mapped.paths.length;
        for (const p of mapped.paths) {
          const target = resolve(root, ...p.split('/'));
          try {
            lstatSync(target);
          } catch {
            joinIssues.push({ path: join(root, c.type, 'criteria-map.yaml'), message: `[join] mapped path does not exist for ${c.id}: ${p}` });
          }
        }
      }
      // Markers use the code validator as single source of truth (TS scanner,
      // string-vs-comment aware). Join records presence from its scoped output.
      const codeProblems = (codeIssueById.get(c.id) ?? []).filter(i => /marker|no code path/i.test(i.message));
      markerOkById.set(c.id, codeProblems.length === 0);

      const testDoc = loadTestDoc(c.viewId);
      if (testDoc === null) {
        joinIssues.push({ path: testFileFor(c.viewId), message: `[join] test YAML missing or unreadable for view ${c.viewId}` });
      } else {
        const feats = testDoc.features.filter(f => f.name === c.featureName);
        if (feats.length === 0) {
          joinIssues.push({ path: testFileFor(c.viewId), message: `[join] test YAML missing feature ${c.featureName} for ${c.id}` });
        } else {
          const ids = feats.flatMap(f => f.ids);
          if (!ids.some(e => e.id === c.id)) {
            joinIssues.push({ path: testFileFor(c.viewId), message: `[join] test YAML missing criterion ${c.id} in feature ${c.featureName}` });
          }
          const extra = ids.map(e => e.id).filter(id => !scopedCriteria.some(s => s.viewId === c.viewId && s.featureName === c.featureName && s.id === id));
          for (const id of Array.from(new Set(extra))) {
            joinIssues.push({ path: testFileFor(c.viewId), message: `[join] test YAML has extra criterion not in navigation: ${id} (feature ${c.featureName})` });
          }
        }
      }
    }
    // Coverage from test YAML for the scoped slice (includes extras for visibility).
    const seenTestIds = new Set<string>();
    for (const c of scopedCriteria) {
      const testDoc = loadTestDoc(c.viewId);
      if (!testDoc) continue;
      for (const f of testDoc.features.filter(f => scope.feature === undefined || f.name === scope.feature)) {
        for (const e of f.ids) {
          const key = `${c.viewId}\u0000${f.name}\u0000${e.id}`;
          if (seenTestIds.has(key)) continue;
          seenTestIds.add(key);
          testsStatus.total += 1;
          if (e.status === 'verde') testsStatus.verde += 1;
          else if (e.status === 'rojo') testsStatus.rojo += 1;
          else if (e.status === 'sin-test') testsStatus.sinTest += 1;
        }
      }
    }
  }
  issues.push(...joinIssues);

  let markersFound = 0;
  for (const c of scopedCriteria) {
    const mapped = mapHas(c.type, c.viewId, c.featureName, c.id);
    const pathsExist = mapped.found && mapped.paths.length > 0 && mapped.paths.every(p => {
      try {
        lstatSync(resolve(root, ...p.split('/')));
        return true;
      } catch {
        return false;
      }
    });
    if (pathsExist && markerOkById.get(c.id) === true) markersFound += 1;
  }

  const scopedVerdict = issues.length === 0;
  const valid = scopedVerdict;
  let globalHint: string;
  if (scope.mode === 'global') {
    globalHint = valid
      ? 'global run: uniqueness and structure fully checked.'
      : 'global run: uniqueness and structure fully checked; fix listed issues.';
  } else {
    globalHint = 'scoped run does not certify global uniqueness or full structure; rerun without --view/--feature for global certification.';
    if (globalOnly.length > 0) {
      globalHint += ` Observed ${globalOnly.length} global-only issue(s) outside scope (structure/paths).`;
    }
  }

  const coverage = {
    views: scope.mode === 'global' ? (views?.length ?? 0) : scopedViews.length,
    features: scope.mode === 'global'
      ? (views?.reduce((n, v) => n + v.features.length, 0) ?? 0)
      : scopedViews.reduce((n, v) => n + v.features.length, 0),
    criteria: scopedCriteria.length,
    docsFiles: docsFound,
    mappedPaths: mappedPathsTotal,
    markersFound,
    tests: testsStatus,
  };

  if (args.json) {
    console.log(JSON.stringify({ valid, scope, scopedVerdict, globalHint, issues, coverage }, null, 2));
  } else {
    console.log(`Scope: ${scope.mode}${scope.view ? ` view:${scope.view}` : ''}${scope.feature ? ` feature:${scope.feature}` : ''}`);
    console.log(`Scoped verdict: ${scopedVerdict ? 'valid' : 'invalid'}`);
    console.log(`Global hint: ${globalHint}`);
    console.log(`Coverage: ${coverage.criteria} criteria, ${coverage.docsFiles} docs files, ${coverage.mappedPaths} mapped paths, ${coverage.markersFound} markers, tests ${testsStatus.total} (verde ${testsStatus.verde}, rojo ${testsStatus.rojo}, sin-test ${testsStatus.sinTest})`);
    if (!issues.length) console.log('Traceability join is valid.');
    else {
      console.error(`Found ${issues.length} issue(s):`);
      for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
      if (globalOnly.length) console.error(`Plus ${globalOnly.length} global-only issue(s) outside scope; see globalHint.`);
    }
  }
  process.exit(issues.length ? 1 : 0);
}

main();
