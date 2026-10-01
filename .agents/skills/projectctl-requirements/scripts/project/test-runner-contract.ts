/**
 * test-runner-contract.ts — Contrato portable del sistema de testing (PCT-89..PCT-94).
 *
 * Paquete `projectctl-requirements` (portable, copy-tree-no-mods). Tipos +
 * validadores puros del runner unificado: sin IO, sin subprocesos, sin red
 * y sin rutas absolutas. El wrapper local `<repo>/scripts/...` (proveído por
 * el destino) aporta el repo root, la ejecución y la persistencia; la
 * evidencia la aporta el wrapper local de la instancia destino (+ inventario).
 *
 * Cubre:
 *  - `validateAcHeader`: `// @ac <ID>` en las primeras 10 líneas.
 *  - `validateOwnerAnnotation`: `// @<view>` owner en las primeras 10 líneas.
 *  - `validateSpecTitleIds`: títulos de spec con ID trazado al header.
 *  - `validateLayout`: each required criterion has at least one mapped file.
 *  - `validateResultsEnvelope`: shape summary/artifact/criteria/risks.
 *  - `PROJECTCTL_TEST_MAPPING`: mapping 1:1 `projectctl test *` ↔ runner.
 *  - `resultsDir` / `validateResultsPath`: persistencia
 *    `.runtime/test-results/<id>/<run-id>/`.
 *  - `AUTO_WRITEBACK_DEFERRED_V1`: fallback pending/not accepted; a passing
 *    persisted run with >0 tests may get V2 write-back from the operator.
 *
 * Cumple: PCT-89, PCT-90, PCT-91, PCT-92, PCT-93, PCT-94, TST-39, TST-40, TST-42.
 * last-verified: 2026-09-27
 */

/** Métodos del runner unificado (byte-idénticos a la instancia local). */
export type TestMethod = 'unit' | 'pwauto' | 'all';

/** Resultado de validar el header AC de un archivo de test. */
export interface AcHeaderCheck {
  ok: boolean;
  ids: string[];
  reason?: string;
}

const AC_LINE_RE = /\/\/\s*@ac\b(.*)$/;
import { criterionIdExpression } from './criterion-contract.ts';
const AC_ID_RE = criterionIdExpression();

/**
 * validateAcHeader — verifica que `source` declare `// @ac <ID>` dentro de
 * sus primeras 10 líneas y devuelve los IDs normalizados en mayúsculas.
 * Puro: no lee disco, solo inspecciona el texto recibido.
 */
export function validateAcHeader(source: string): AcHeaderCheck {
  const ids: string[] = [];
  for (const line of source.split(/\r?\n/).slice(0, 10)) {
    const match = AC_LINE_RE.exec(line);
    if (!match) continue;
    for (const id of match[1].matchAll(AC_ID_RE)) {
      if (id[1]) ids.push(id[1].toUpperCase());
    }
  }
  if (ids.length === 0) return { ok: false, ids, reason: 'missing-ac-header-first-10-lines' };
  return { ok: true, ids: [...new Set(ids)].sort() };
}

/** Resultado de validar la anotación owner de un archivo de test. */
export interface OwnerAnnotationCheck {
  ok: boolean;
  owners: string[];
  reason?: string;
}

const OWNER_LINE_RE = /\/\/\s*@([A-Za-z][A-Za-z0-9_-]*)(?![A-Za-z0-9_:-])/;

/**
 * parseOwnerAnnotation — tokens `// @<view>` en las primeras 10 líneas,
 * excluyendo `ac`. Puro: no lee disco.
 */
export function parseOwnerAnnotation(source: string): string[] {
  const owners: string[] = [];
  for (const line of source.split(/\r?\n/).slice(0, 10)) {
    const match = OWNER_LINE_RE.exec(line);
    if (!match || !match[1]) continue;
    if (match[1].toLowerCase() === 'ac') continue;
    owners.push(match[1]);
  }
  return [...new Set(owners)];
}

/**
 * validateOwnerAnnotation — al menos un token owner MUST coincidir
 * (case-insensitive) con una vista conocida del manifest del proyecto.
 */
export function validateOwnerAnnotation(source: string, knownViews: readonly string[]): OwnerAnnotationCheck {
  const owners = parseOwnerAnnotation(source);
  const known = new Set(knownViews.map((view) => view.toLowerCase()));
  if (owners.some((owner) => known.has(owner.toLowerCase()))) return { ok: true, owners };
  if (owners.length === 0) return { ok: false, owners, reason: 'missing-owner-annotation-first-10-lines' };
  return { ok: false, owners, reason: 'owner-annotation-unknown-view' };
}

/** Título de spec extraído de `test('...')` / `test("...")`. */
export interface SpecTitleEntry {
  title: string;
  criterionIds: string[];
}

/**
 * collectSpecTitles — títulos literales de `test()` con sus IDs
 * de criterio. Puro: inspección de texto, sin IO.
 */
export function collectSpecTitles(source: string): SpecTitleEntry[] {
  const entries: SpecTitleEntry[] = [];
  for (const match of source.matchAll(/(?:^|[^\w$.])test\s*\(\s*(['"])((?:(?!\1)[^\\]|\\.)*)\1/gm)) {
    const title = match[2] ?? '';
    const ids = [...title.matchAll(AC_ID_RE)].map((id) => (id[1] ?? '').toUpperCase()).filter(Boolean);
    entries.push({ title, criterionIds: [...new Set(ids)].sort() });
  }
  return entries;
}

/** Resultado de validar que los títulos llevan ID trazado al header. */
export interface SpecTitleCheck {
  ok: boolean;
  missingTitleId: string[];
  headerMismatch: string[];
}

/**
 * validateSpecTitleIds — cada título MUST contener un ID presente en
 * `headerIds` (el runner filtra con `--grep` sobre el título; un título
 * sin ID nunca ejecuta en el run gestionado).
 */
export function validateSpecTitleIds(source: string, headerIds: readonly string[]): SpecTitleCheck {
  const header = new Set(headerIds.map((id) => id.toUpperCase()));
  const missingTitleId: string[] = [];
  const headerMismatch: string[] = [];
  for (const entry of collectSpecTitles(source)) {
    if (entry.criterionIds.length === 0) {
      missingTitleId.push(entry.title);
      continue;
    }
    for (const id of entry.criterionIds) {
      if (!header.has(id)) headerMismatch.push(`${entry.title} => ${id}`);
    }
  }
  return { ok: missingTitleId.length === 0 && headerMismatch.length === 0, missingTitleId, headerMismatch };
}

/** Entrada de layout: path del archivo + IDs que su header declara. */
export interface LayoutEntry {
  path: string;
  criterionIds: readonly string[];
}

/** Resultado de validar que los IDs requeridos aparecen en el inventario. */
export interface LayoutCheck {
  ok: boolean;
  /** IDs requeridos sin ningún archivo que los cubra. */
  missing: string[];
  /** IDs presentes en archivos pero fuera del alcance requerido. */
  extra: string[];
}

/**
 * validateLayout — cada ID requerido MUST estar cubierto por al menos un
 * archivo; un archivo puede mapear varios IDs. Puro: el llamador aporta las entradas
 * ya parseadas; este contrato no lista directorios ni abre archivos.
 */
export function validateLayout(
  entries: readonly LayoutEntry[],
  requiredIds: readonly string[],
): LayoutCheck {
  const seen = new Set<string>();
  for (const entry of entries) {
    for (const id of entry.criterionIds) seen.add(id.toUpperCase());
  }
  const required = requiredIds.map((id) => id.toUpperCase());
  const requiredSet = new Set(required);
  const missing = required.filter((id) => !seen.has(id)).sort();
  const extra = [...seen].filter((id) => !requiredSet.has(id)).sort();
  return { ok: missing.length === 0, missing, extra };
}

/** Estados de criterio admitidos en el envelope de resultados. */
export type CriterionResultStatus =
  | 'covered'
  | 'partial'
  | 'missing'
  | 'not-applicable'
  | 'no-tests'
  | 'timeout'
  | 'unknown'
  | 'failed'
  | 'skipped';

/** Shape canónico del envelope de resultados de un run. */
export interface ResultsEnvelope {
  summary: { runId: string; status: string; passed: number; failed: number; skipped: number };
  artifact: { dir: string; files: string[] };
  criteria: Array<{ id: string; status: CriterionResultStatus }>;
  risks: string[];
}

/** Resultado de validar el envelope de resultados. */
export interface EnvelopeCheck {
  ok: boolean;
  reason?: string;
}

/**
 * validateResultsEnvelope — verifica el shape summary/artifact/criteria/risks
 * del `summary.json` de un run. Puro: valida estructura, nunca muta bundles.
 */
export function validateResultsEnvelope(input: unknown): EnvelopeCheck {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'envelope-must-be-object' };
  const env = input as Record<string, unknown>;
  for (const key of ['summary', 'artifact', 'criteria', 'risks'] as const) {
    if (!(key in env)) return { ok: false, reason: `envelope-missing-${key}` };
  }
  if (!Array.isArray(env['criteria'])) return { ok: false, reason: 'envelope-criteria-must-be-array' };
  if (!Array.isArray(env['risks'])) return { ok: false, reason: 'envelope-risks-must-be-array' };
  const summary = env['summary'] as Record<string, unknown>;
  for (const key of ['runId', 'status', 'passed', 'failed', 'skipped'] as const) {
    if (!(key in summary)) return { ok: false, reason: `envelope-summary-missing-${key}` };
  }
  const artifact = env['artifact'] as Record<string, unknown>;
  if (typeof artifact['dir'] !== 'string' || !Array.isArray(artifact['files'])) {
    return { ok: false, reason: 'envelope-artifact-shape-invalid' };
  }
  for (const criterion of env['criteria'] as Array<unknown>) {
    if (!criterion || typeof criterion !== 'object') {
      return { ok: false, reason: 'envelope-criterion-must-be-object' };
    }
    const entry = criterion as Record<string, unknown>;
    if (typeof entry['id'] !== 'string' || typeof entry['status'] !== 'string') {
      return { ok: false, reason: 'envelope-criterion-shape-invalid' };
    }
  }
  return { ok: true };
}

/** Fila del mapping 1:1 entre CLI `projectctl test *` y runner interno. */
export interface ProjectctlTestMapping {
  cli: string;
  runner: string;
}

/**
 * PROJECTCTL_TEST_MAPPING — mapping 1:1 `projectctl test *` ↔ runner
 * (PCT-75..78 vía PCT-91). Las filas de lectura no ejecutan el runner:
 * leen `.runtime/test-results/<projectId>/`.
 */
export const PROJECTCTL_TEST_MAPPING: readonly ProjectctlTestMapping[] = [
  {
    cli: 'projectctl test run --method=unit --target=<view>[:<feature>]',
    runner: 'bun run scripts/test-runner.ts run --method=unit --target=<view>[:<feature>]',
  },
  {
    cli: 'projectctl test run --method=pwauto --target=<view>[:<feature>] --persist',
    runner: 'bun run scripts/test-runner.ts run --method=pwauto --target=<view>[:<feature>] --persist',
  },
  {
    cli: 'projectctl test run --method=all --target=<view>[:<feature>]',
    runner: 'bun run scripts/test-runner.ts run --method=all --target=<view>[:<feature>]',
  },
  {
    cli: 'projectctl test list-runs [--limit=N]',
    runner: 'n/a (lectura de .runtime/test-results/<projectId>/)',
  },
  {
    cli: 'projectctl test results <run-id>',
    runner: 'n/a (lee summary.json del run id)',
  },
  {
    cli: 'projectctl test schedule-add ...',
    runner: "API project_scheduled_tasks mode='test'",
  },
];

/** True cuando `cli` es un comando del mapping 1:1. */
export function mappingCovers(cli: string): boolean {
  return PROJECTCTL_TEST_MAPPING.some((entry) => entry.cli === cli);
}

/** Base portable de persistencia de runs. */
export const RESULTS_BASE = '.runtime/test-results' as const;

/** Archivos que cada ejecución MUST escribir por método (unit|pwauto). */
export const RUN_ARTIFACT_FILES = ['junit.xml', 'results.json', 'summary.json'] as const;

/**
 * resultsDir — ruta portable de un run:
 * `.runtime/test-results/<projectId>/<run-id>`.
 */
export function resultsDir(projectId: string, runId: string): string {
  return `${RESULTS_BASE}/${projectId}/${runId}`;
}

/** Resultado de validar la ruta de persistencia de un run. */
export interface ResultsPathCheck {
  ok: boolean;
  dir?: string;
  reason?: string;
}

const PROJECT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const RUN_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** validateResultsPath — IDs con forma válida antes de persistir el run. */
export function validateResultsPath(projectId: string, runId: string): ResultsPathCheck {
  if (!PROJECT_ID_RE.test(projectId)) return { ok: false, reason: 'invalid-project-id' };
  if (!RUN_ID_RE.test(runId)) return { ok: false, reason: 'invalid-run-id' };
  return { ok: true, dir: resultsDir(projectId, runId) };
}

/** Fallback when `criteria[].coverage` was not accepted by the V2 writer. */
export const AUTO_WRITEBACK_DEFERRED_V1 = 'AUTO_WRITEBACK_DEFERRED_V1' as const;

/** Status used only on the fallback path, not on accepted V2 write-back. */
export type CoverageV1Status = 'pending' | 'not-accepted';

/** validateCoveragePending — solo `pending`/`not-accepted` son válidos en v1. */
export function validateCoveragePending(status: string): status is CoverageV1Status {
  return status === 'pending' || status === 'not-accepted';
}
