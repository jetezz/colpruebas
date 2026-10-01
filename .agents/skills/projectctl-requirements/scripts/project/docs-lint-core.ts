/**
 * docs-lint-core.ts — Contrato portable de trazabilidad código⇒criterio (checks 1-5).
 *
 * Paquete `projectctl-requirements` (portable, copy-tree-no-mods). Lógica pura
 * de los 5 checks de `docs:lint`, parametrizada por `loadCriteria` (parser),
 * globs e IO; este archivo NO tiene ningún import estático hacia `sandbox/`,
 * `frontend/` ni `.atl/`. El filesystem se inyecta vía `DocsLintFileIo`
 * (defaults Node: `globby` + `node:fs/promises`).
 *
 * Checks (spec portable, citado —no copiado— en `references/test/reglas.md`
  * y `references/standard.md` §1/§2):
 *  1. Bundles app-map autoconsistentes (`criteria[].id` parseable, shape
 *     `{id, title, functional, coverage, type}`).
 *  2. Contrato estructural STRICT (parser exacto del runtime; un bundle que
 *     haría 422 en `GET /api/projects/:id/docs/app-map` falla aquí).
 *  3. Códigos en specs PW-AUTO (filenames, describes, `@ac`, annotations)
 *     existen en la SoT `docs/app-map/**`.
 *  4. Códigos en unit tests y código producto referencian IDs declarados.
 *  5. Gate `test:check` (TST-13): `functional: implemented` exige
 *     `coverage.Unit = covered` AND `coverage.PW-AUTO = covered`
 *     (salvo `skip_quality_gate: true`; Manual y PW-CLI exentos).
 *
 * El wrapper local `<repo>/scripts/...` (proveído por el destino) inyecta el
 * parser real + globs del repo. La evidencia la aporta el wrapper local de
 * la instancia destino.
 *
 * Cumple: PCT-154, TST-38, AC-329.
 * last-verified: 2026-09-27
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

/** Canonical docs gate. `bun run docs:lint` remains compatibility lint, not gate evidence. */
export const CANONICAL_DOCS_GATE = 'projectctl docs check' as const;

/** Canonical PW-AUTO spec glob (portable convention; la instancia puede pasar el suyo por parámetro). */
export const PW_SPEC_GLOBS = ['tests/e2e/**/*.spec.ts'];
/** Canonical unit-test globs (portable convention; la instancia puede pasar los suyos por parámetro). */
export const UNIT_TEST_GLOBS = [
  'tests/unit/**/*.{test,spec}.{ts,tsx}',
  'frontend/__tests__/**/*.{test,spec}.{ts,tsx}',
  'frontend/src/**/*.{test,spec}.{ts,tsx}',
  'api/src/**/*.{test,spec}.ts',
  'sandbox/src/**/*.{test,spec}.ts',
  'sandbox/__tests__/**/*.{test,spec}.ts',
  'shared/**/*.{test,spec}.ts',
  'scripts/**/*.{test,spec}.ts',
];
/** Canonical product-code globs (portable convention; la instancia puede pasar los suyos por parámetro). */
export const PRODUCT_CODE_GLOBS = [
  'frontend/src/**/*.{ts,tsx}',
  'api/src/**/*.ts',
  'sandbox/src/**/*.ts',
  'shared/**/*.ts',
  'scripts/**/*.ts',
];

import { criterionIdExpression } from './criterion-contract.ts';
const CRITERION_ID_RE = criterionIdExpression();
const SYNTHETIC_FIXTURE_LINE_MARKER = 'docs-lint-synthetic-fixture';

const APP_MAP_FUNCTIONAL_STATES = ['implemented', 'partial', 'missing', 'not-applicable'] as const;
const APP_MAP_COVERAGE_METHODS = ['Unit', 'PW-CLI', 'PW-AUTO', 'Manual'] as const;
const APP_MAP_COVERAGE_STATES = ['covered', 'partial', 'missing', 'not-applicable'] as const;

type AppMapCriterionFunctional = (typeof APP_MAP_FUNCTIONAL_STATES)[number];
type AppMapCoverageMethod = (typeof APP_MAP_COVERAGE_METHODS)[number];
type AppMapCoverageState = (typeof APP_MAP_COVERAGE_STATES)[number];

interface AppMapCriterion {
  id: string;
  title: string;
  type: string;
  functional: AppMapCriterionFunctional;
  coverage: Record<AppMapCoverageMethod, AppMapCoverageState>;
  skipQualityGate: boolean;
}

export type AppMapLoaderOptions = {
  files?: readonly string[];
  readFile?: (file: string) => Promise<string>;
};

/** Filesystem boundary (inyectable; defaults Node puros, sin sandbox/). */
export interface DocsLintFileIo {
  listFiles: (patterns: string | string[], cwd: string) => Promise<string[]>;
  readFile: (cwd: string, file: string) => Promise<string>;
}

export async function defaultListFiles(patterns: string | string[], cwd: string): Promise<string[]> {
  return globby(patterns, { cwd });
}

export async function defaultReadFile(cwd: string, file: string): Promise<string> {
  return fs.readFile(path.join(cwd, file), 'utf8');
}

export const defaultIo: DocsLintFileIo = { listFiles: defaultListFiles, readFile: defaultReadFile };

/** Parser real de criterios (lo provee la instancia; p. ej. `projectctl-local-static.ts`). */
export type LoadCriteriaFn = (
  cwd: string,
  options?: AppMapLoaderOptions,
) => Promise<{ criteria: AppMapCriterion[]; errors: string[]; ids: Set<string> }>;

/** Checker estricto a nivel archivos (lo provee la instancia sobre el mismo parser). */
export type CheckStrictFilesFn = (
  options: AppMapLoaderOptions & { files: readonly string[] },
) => Promise<string[]>;

function normalizeCriterionId(value: string): string {
  return value.toUpperCase();
}

export function collectCriterionPrefixes(ids: Iterable<string>): Set<string> {
  const prefixes = new Set<string>();
  for (const id of ids) {
    const match = normalizeCriterionId(id).match(/^([A-Z][A-Z0-9]*)-/);
    if (match) prefixes.add(match[1]);
  }
  return prefixes;
}

export function stripSyntheticFixtureLines(content: string): string {
  return content
    .split(/\r?\n/)
    .filter((line) => !line.includes(SYNTHETIC_FIXTURE_LINE_MARKER))
    .join('\n');
}

export function collectCriterionIds(content: string, allowedPrefixes: ReadonlySet<string>): string[] {
  const traceableContent = stripSyntheticFixtureLines(content);
  return Array.from(traceableContent.matchAll(CRITERION_ID_RE), (match) => {
    const id = normalizeCriterionId(match[1]);
    return id;
  })
    .filter((id) => allowedPrefixes.has(id.slice(0, id.indexOf('-'))));
}

export function collectPlaywrightCriterionIds(
  filename: string,
  content: string,
  allowedPrefixes: ReadonlySet<string>,
): string[] {
  const ids = collectCriterionIds(filename, allowedPrefixes);

  for (const match of content.matchAll(/(?:test\.describe(?:\.serial)?|describe)\s*\(\s*(['"`])([^'"`]+)\1/gi)) {
    ids.push(...collectCriterionIds(match[2], allowedPrefixes));
  }

  for (const line of stripSyntheticFixtureLines(content).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:\/\/|\/\*+|\*)\s*@ac\b(.*)$/i);
    if (match) ids.push(...collectCriterionIds(match[1], allowedPrefixes));
  }

  for (const call of content.matchAll(/(?:test\.info\(\)|testInfo)\.annotations\.push\s*\(([\s\S]*?)\)\s*;/g)) {
    for (const object of call[1].matchAll(/\{([^{}]*)\}/g)) {
      if (!/\btype\s*:\s*(['"])ac\1/i.test(object[1])) continue;
      const description = object[1].match(/\bdescription\s*:\s*(['"])(.*?)\1/i);
      if (description) ids.push(...collectCriterionIds(description[2], allowedPrefixes));
    }
  }

  return ids;
}

function isFunctionalState(value: unknown): value is AppMapCriterionFunctional {
  return typeof value === 'string' && (APP_MAP_FUNCTIONAL_STATES as readonly string[]).includes(value);
}

function isCoverageState(value: unknown): value is AppMapCoverageState {
  return typeof value === 'string' && (APP_MAP_COVERAGE_STATES as readonly string[]).includes(value);
}

export { isFunctionalState, isCoverageState };

/** Check 1 — carga delegada al parser inyectado (la instancia pasa el parser real). */
export async function loadAppMapCriteria(
  cwd: string,
  options: AppMapLoaderOptions = {},
  loader: LoadCriteriaFn,
): Promise<{ criteria: AppMapCriterion[]; errors: string[]; ids: Set<string> }> {
  return loader(cwd, options);
}

/** Check 2 — contrato strict delegada al checker inyectado (mismo parser del runtime). */
export async function checkStrictAppMapContract(
  cwd: string,
  glob: string,
  options: AppMapLoaderOptions = {},
  checker: CheckStrictFilesFn,
  io: DocsLintFileIo = defaultIo,
): Promise<string[]> {
  const files = options.files ? [...options.files] : await io.listFiles(glob, cwd);
  return checker({
    files,
    readFile: options.readFile ?? ((file) => io.readFile(cwd, file)),
  });
}

/** Check 3 — specs PW-AUTO contra la SoT. */
export async function checkPlaywrightSpecs(
  knownIds: Set<string>,
  cwd: string = process.cwd(),
  globs: string[] = [...PW_SPEC_GLOBS],
  io: DocsLintFileIo = defaultIo,
): Promise<string[]> {
  const errors: string[] = [];
  const files = new Set(await io.listFiles(globs, cwd));
  const allowedPrefixes = collectCriterionPrefixes(knownIds);

  for (const file of files) {
    const content = await io.readFile(cwd, file);
    const codes = new Set(collectPlaywrightCriterionIds(path.basename(file), content, allowedPrefixes));
    for (const code of codes) {
      if (!knownIds.has(code)) {
        errors.push(`[pw-auto] ${file}: references "${code}" which is not declared in any docs/app-map/** bundle`);
      }
    }
  }

  return errors;
}

/** Check 4a — unit tests contra la SoT. */
export async function checkUnitTests(
  knownIds: Set<string>,
  cwd: string = process.cwd(),
  globs: string[] = [...UNIT_TEST_GLOBS],
  io: DocsLintFileIo = defaultIo,
): Promise<string[]> {
  const errors: string[] = [];
  const files = new Set(await io.listFiles(globs, cwd));
  const allowedPrefixes = collectCriterionPrefixes(knownIds);

  for (const file of files) {
    const content = await io.readFile(cwd, file);
    for (const code of new Set(collectCriterionIds(content, allowedPrefixes))) {
      if (!knownIds.has(code)) {
        errors.push(`[unit] ${file}: references "${code}" which is not declared in any docs/app-map/** bundle`);
      }
    }
  }

  return errors;
}

/** Check 4b — código producto contra la SoT (omite tests + `skipFile`, p. ej. el propio wrapper). */
export async function checkProductCode(
  knownIds: Set<string>,
  cwd: string = process.cwd(),
  globs: string[] = [...PRODUCT_CODE_GLOBS],
  io: DocsLintFileIo = defaultIo,
  skipFile: (file: string) => boolean = () => false,
): Promise<string[]> {
  const errors: string[] = [];
  const files = await io.listFiles(globs, cwd);
  const allowedPrefixes = collectCriterionPrefixes(knownIds);

  for (const file of files) {
    if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) continue;
    if (skipFile(file)) continue;

    const content = await io.readFile(cwd, file);
    for (const code of collectCriterionIds(content, allowedPrefixes)) {
      if (!knownIds.has(code)) {
        errors.push(`[product] ${file}: references "${code}" which is not declared in any docs/app-map/** bundle`);
      }
    }
  }

  return errors;
}

/**
 * Check 5 — gate TST-13 (puro): `functional: implemented` exige
 * `coverage.Unit = covered` AND `coverage.PW-AUTO = covered`
 * (salvo `skip_quality_gate`; Manual y PW-CLI exentos por diseño).
 */
export function checkTestGate(criteria: AppMapCriterion[]): string[] {
  const errors: string[] = [];
  for (const criterion of criteria) {
    if (!criterion.id) continue;
    if (criterion.functional !== 'implemented') continue;
    if (criterion.skipQualityGate) continue;

    const unitOk = criterion.coverage.Unit === 'covered';
    const pwautoOk = criterion.coverage['PW-AUTO'] === 'covered';

    if (!unitOk || !pwautoOk) {
      const reasons: string[] = [];
      if (!unitOk) reasons.push(`Unit=${criterion.coverage.Unit}`);
      if (!pwautoOk) reasons.push(`PW-AUTO=${criterion.coverage['PW-AUTO']}`);
      errors.push(`[test-gate] ${criterion.id}: functional=implemented but coverage [${reasons.join(', ')}] (override via skip_quality_gate: true)`);
    }
  }
  return errors;
}

export type BundleTypeGateReport = {
  errors: string[];
  bundles: { file: string; typed: number; untyped: number }[];
};

export type BundleTypeGateOptions = {
  files?: readonly string[];
  readFile?: (file: string) => Promise<string>;
};

/**
 * Hard per-bundle `type` gate (AC-005 / D-3): todo criterio declarado MUST
 * llevar `type` (hard error `[app-map-contract]`, sin tier informativo).
 */
export async function checkPerBundleTypeGate(
  cwd: string,
  loader: LoadCriteriaFn,
  options: BundleTypeGateOptions = {},
  io: DocsLintFileIo = defaultIo,
): Promise<BundleTypeGateReport> {
  const files = options.files ? [...options.files] : await io.listFiles('docs/app-map/**/*.md', cwd);
  const errors: string[] = [];
  const bundles: BundleTypeGateReport['bundles'] = [];

  for (const file of files) {
    const { criteria } = await loader(cwd, { files: [file], readFile: options.readFile });
    let typed = 0;
    let untyped = 0;

    for (const criterion of criteria) {
      if (!criterion.type) {
        errors.push(`[app-map-contract] ${file}: criterion ${criterion.id} requires type`);
        untyped += 1;
      } else {
        typed += 1;
      }
    }

    bundles.push({ file, typed, untyped });
  }

  return { errors, bundles };
}

export interface DocsLintRunGlobs {
  appMap: string;
  pw: string[];
  unit: string[];
  product: string[];
}

export interface DocsLintRunDeps {
  loadCriteria: LoadCriteriaFn;
  checkStrictFiles: CheckStrictFilesFn;
  io?: DocsLintFileIo;
  /** El wrapper se excluye a sí mismo (contiene IDs en comentarios). */
  selfFile?: string;
}

/**
 * Flujo `docs:lint` completo (checks 1-5 + type gate). Retorna exit code
 * (0 ok / 1 errores); el gate TST-13 se reporta pero NO bloquea.
 */
export async function runDocsLint(
  cwd: string,
  globs: DocsLintRunGlobs,
  deps: DocsLintRunDeps,
): Promise<number> {
  const io = deps.io ?? defaultIo;
  console.log('📋 docs-lint: Validating criterion-code traceability against docs/app-map/** (SoT)...');
  console.log(`   Canonical docs gate: ${CANONICAL_DOCS_GATE} (this script is compatibility lint, not gate evidence).\n`);

  const { criteria, errors: appMapErrors, ids: knownIds } = await deps.loadCriteria(cwd);
  console.log(`  docs/app-map/**: ${knownIds.size} unique criterion IDs across ${criteria.length} criteria entries\n`);

  if (appMapErrors.length > 0) {
    console.error('❌ App-Map frontmatter parse errors:');
    for (const err of appMapErrors) console.error(`  ${err}`);
    console.error('');
  }

  const pwErrors = await checkPlaywrightSpecs(knownIds, cwd, globs.pw, io);
  const unitErrors = await checkUnitTests(knownIds, cwd, globs.unit, io);
  const productErrors = await checkProductCode(knownIds, cwd, globs.product, io, (file) => file === deps.selfFile);
  const gateErrors = checkTestGate(criteria);
  const contractErrors = await checkStrictAppMapContract(cwd, globs.appMap, {}, deps.checkStrictFiles, io);
  const typeGate = await checkPerBundleTypeGate(cwd, deps.loadCriteria, {}, io);

  let hasErrors = appMapErrors.length > 0;

  if (contractErrors.length > 0) {
    hasErrors = true;
    console.error('❌ App-Map strict contract errors (would 422 at runtime):');
    for (const err of contractErrors) console.error(`  ${err}`);
    console.error('');
  }

  if (typeGate.errors.length > 0) {
    hasErrors = true;
    console.error('❌ App-Map type gate errors (every criterion requires `type`):');
    for (const err of typeGate.errors) console.error(`  ${err}`);
    console.error('');
  }

  if (pwErrors.length > 0) {
    hasErrors = true;
    console.error('❌ PW-AUTO spec errors:');
    for (const err of pwErrors) console.error(`  ${err}`);
    console.error('');
  }

  if (unitErrors.length > 0) {
    hasErrors = true;
    console.error('❌ Unit test criterion errors:');
    for (const err of unitErrors) console.error(`  ${err}`);
    console.error('');
  }

  if (productErrors.length > 0) {
    hasErrors = true;
    console.error('❌ Product code criterion errors:');
    for (const err of productErrors) console.error(`  ${err}`);
    console.error('');
  }

  // test:check gate is reported but does NOT block `bun run docs:lint` (it's
  // a separate gate that can be invoked explicitly via `bun run test:check`
  // through the implemented `bun run test:check` runner. It remains visible
  // here so the bundle owner can see which criteria need coverage before closure.
  if (gateErrors.length > 0) {
    console.warn('⚠️  test:check gate (TST-13) gaps:');
    for (const err of gateErrors) console.warn(`  ${err}`);
    console.warn('');
  }

  if (!hasErrors) {
    console.log('✅ All criterion codes are traceable to docs/app-map/** frontmatter');
  }

  const totalIssues = appMapErrors.length + contractErrors.length + typeGate.errors.length + pwErrors.length + unitErrors.length + productErrors.length;
  if (totalIssues > 0) {
    console.error(`\n❌ ${totalIssues} error(s) found.`);
    return 1;
  }

  if (gateErrors.length > 0) {
    console.warn(`\n⚠️  ${gateErrors.length} gate gap(s) reported (TST-13, non-blocking for docs-lint).`);
  }

  console.log('\n✅ Lint passed.');
  return 0;
}
