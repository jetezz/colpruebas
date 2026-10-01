/**
 * code-traceability-contract.ts — Contrato portable de trazabilidad código↔criterio.
 *
 * Paquete `projectctl-requirements` (portable, copy-tree-no-mods). Shape +
 * validador puro del locator código↔criterio: sin IO, sin `node:fs`, sin
 * subprocesos, sin red, sin rutas absolutas y sin imports estáticos hacia
 * `sandbox/`, `frontend/` ni `.atl/`. El wrapper local `<repo>/scripts/...`
 * (proveído por el destino) aporta las lecturas, el snapshot y el CLI de la
 * instancia; la evidencia de instancia es el `code:check` + doctor del destino.
 *
 * Cubre (ventana warn-first, OPCIÓN A — warn, never fail):
 *  - `TraceRoots`: raíces `front` / `back` / `tests` del manifest.
 *  - `validateRoots`: arrays no vacíos, paths relativos POSIX, sin `..`.
 *  - `validateManifestShape`: shape mínimo válido; manifest inválido o
 *    ausente ⇒ `not-applicable` (la proyección se salta, no bloquea).
 *  - Regex canónicas `@criterion` / `@trace` / `@ac` / `@contract` con los
 *    tres prefijos de comentario (`//`, `--`, `<!--`).
 *  - `isAdjacent`: el bloque marcado debe ser la declaración elegible
 *    siguiente (solo blancos/doc-lines en medio; imports la interrumpen).
 *  - `ORPHAN_CODE_BLOCK_SEVERITY = 'warning'`: huérfano siempre warn,
 *    nunca error (no endurecer a error en esta ventana).
 *
 * Cumple: REQ-CODETRACE-001 (locator; namespace técnico de la task, no añade
 * un PCT), REQ-CODETRACE-002 (markers + adyacencia).
 * last-verified: 2026-09-27
 */

/** Versión del schema del manifest de trazabilidad (byte-idéntica a la instancia). */
export const CODE_TRACEABILITY_SCHEMA = 'code-traceability/v1' as const;

/** Superficies del locator: front / back / test. */
export type TraceSurface = 'front' | 'back' | 'test';

/** Tags de marcador soportados por el locator. */
export type MarkerTag = '@criterion' | '@trace' | '@ac' | '@contract';

/** Prefijos de comentario canónicos del manifest (`marker.comments`). */
export const MARKER_COMMENT_PREFIXES = ['//', '--', '<!--'] as const;

/** Raíces de superficie declaradas por el manifest (paths relativos POSIX). */
export interface TraceRoots {
  readonly front: readonly string[];
  readonly back: readonly string[];
  readonly tests: readonly string[];
}

/** Shape mínimo portable del manifest `code-traceability/v1`. */
export interface TraceManifestShape {
  readonly schemaVersion: typeof CODE_TRACEABILITY_SCHEMA;
  readonly readOnly: true;
  readonly roots: TraceRoots;
  readonly policyMode: 'warn';
}

/** Resultado de validar el shape del manifest. */
export type ManifestApplicability =
  | { readonly applicable: true }
  | { readonly applicable: false; readonly reason: 'not-applicable: manifest invalid or absent' };

/** Severidad del hallazgo de bloque huérfano: warn-only en la ventana warn-first. */
export const ORPHAN_CODE_BLOCK_SEVERITY = 'warning' as const;

/** Código del hallazgo de bloque huérfano (byte-idéntico a la instancia). */
export const ORPHAN_CODE_BLOCK = 'ORPHAN_CODE_BLOCK' as const;

// ─── Regex canónicas (misma forma que la instancia sandbox) ─────────────
// CRITERION_ID es la forma léxica genérica (`HOME-01`, `PCT-01`, `AC-001`…).
// El shape nunca otorga existencia: la resolución contra criterios conocidos
// la hace la instancia (C2); aquí solo se valida forma.
import { CRITERION_ID_PATTERN as CORE_CRITERION_ID_PATTERN } from './criterion-contract.ts';
export const CRITERION_ID_PATTERN = CORE_CRITERION_ID_PATTERN.slice(1, -1);
export const REQ_ID_PATTERN = 'REQ-[A-Z0-9]+(?:-[A-Z0-9]+)*';
export const IDENT_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*';

const COMMENT_PREFIX = '(?://|--|<!--)';
const COMMENT_SUFFIX = '(?:-->)?';

export const CRITERION_RE = new RegExp(
  `^\\s*${COMMENT_PREFIX}\\s*@criterion\\s+(${CRITERION_ID_PATTERN})\\s*${COMMENT_SUFFIX}\\s*$`,
);
export const TRACE_RE = new RegExp(
  `^\\s*${COMMENT_PREFIX}\\s*@trace\\s+(.+?)\\s*${COMMENT_SUFFIX}\\s*$`,
);
export const AC_RE = new RegExp(
  `^\\s*${COMMENT_PREFIX}\\s*@ac\\s+(${CRITERION_ID_PATTERN}(?:[\\s,]+${CRITERION_ID_PATTERN})*)\\s*${COMMENT_SUFFIX}\\s*$`,
);
export const CONTRACT_RE = new RegExp(
  `^\\s*${COMMENT_PREFIX}\\s*@contract\\s+auth=(verified-jwt|none|internal-trusted)\\s+ownership=(project|user|none)\\s+side-effects=(none|db|webhook|filesystem)\\s*${COMMENT_SUFFIX}\\s*$`,
);

const MARKER_TAG_AT_START_RE = /^\s*(?:\/\/|--|<!--|#|\*|\/\*)\s*(@criterion|@trace\b|@contract\b|@ac\b)/;

/** True cuando la línea abre con un tag de marcador en posición de comentario. */
export function isMarkerLike(line: string): boolean {
  return MARKER_TAG_AT_START_RE.test(line);
}

/** Marcador parseado (forma; la semántica la resuelve la instancia). */
export interface ParsedMarkerShape {
  readonly kind: 'criterion' | 'trace' | 'ac-evidence' | 'contract';
  readonly line: number;
  readonly tag: MarkerTag;
  readonly criterionId?: string;
}

/**
 * parseMarkerLine — clasifica una línea por forma canónica. Puro: no lee
 * disco, solo inspecciona el texto recibido. Retorna `null` cuando la línea
 * no es un marcador con forma válida (el llamador usa `isMarkerLike` para
 * detectar intentos malformados como `TRACE_FORMAT_INVALID`).
 */
export function parseMarkerLine(line: string, lineNumber: number): ParsedMarkerShape | null {
  const criterion = line.match(CRITERION_RE);
  if (criterion?.[1]) {
    return { kind: 'criterion', line: lineNumber, tag: '@criterion', criterionId: criterion[1].toUpperCase() };
  }
  const contract = line.match(CONTRACT_RE);
  if (contract) return { kind: 'contract', line: lineNumber, tag: '@contract' };
  const ac = line.match(AC_RE);
  if (ac?.[1]) {
    const first = ac[1].split(/[\s,]+/).filter((token) => token.length > 0)[0];
    return { kind: 'ac-evidence', line: lineNumber, tag: '@ac', criterionId: first?.toUpperCase() };
  }
  const trace = line.match(TRACE_RE);
  if (trace) {
    const acRef = trace[1].match(new RegExp(`ac=(${CRITERION_ID_PATTERN})`));
    return {
      kind: 'trace',
      line: lineNumber,
      tag: '@trace',
      ...(acRef?.[1] ? { criterionId: acRef[1].toUpperCase() } : {}),
    };
  }
  return null;
}

const DOC_LINE_RE = /^\s*(\/\*\*|\*\/|\*|;;;|\/\/\/)/;
const COMMENT_LINE_RE = /^\s*(\/\/|--|<!--|\*|#)/;
const IMPORT_LINE_RE = /^\s*import\b/;
const REEXPORT_LINE_RE = /^\s*export\s+(\*\s*from\b|\{[^}]*\}\s*from\b)/;

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function isCodeLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^(-->)\s*$/.test(trimmed)) return false;
  return !COMMENT_LINE_RE.test(line);
}

/**
 * isAdjacent — el grupo de marcadores es adyacente cuando entre la última
 * línea de marcador y la siguiente línea de código elegible solo hay blancos
 * o doc-lines; cualquier otro comentario o un import/re-export en medio lo
 * vuelve distante (`TRACE_NOT_ADJACENT` en la instancia). Puro: opera sobre
 * las líneas ya leídas por la instancia.
 */
export function isAdjacent(lines: readonly string[], lastMarkerLine: number): boolean {
  for (let cursor = lastMarkerLine + 1; cursor <= lines.length; cursor += 1) {
    const text = lines[cursor - 1] ?? '';
    if (isBlank(text) || DOC_LINE_RE.test(text)) continue;
    if (IMPORT_LINE_RE.test(text) || REEXPORT_LINE_RE.test(text)) return false;
    if (isCodeLine(text)) return true;
    return false;
  }
  return false;
}

function isRelativePosix(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false;
  if (value.startsWith('/') || value.includes('\\')) return false;
  return !value.replace(/\/+/g, '/').split('/').some((part) => part === '..');
}

/**
 * validateRoots — raíces `front` / `back` / `tests`: arrays no vacíos de
 * paths relativos POSIX sin `..`. Puro: valida valores, nunca toca disco.
 */
export function validateRoots(roots: unknown): roots is TraceRoots {
  if (!roots || typeof roots !== 'object') return false;
  const record = roots as Record<string, unknown>;
  for (const key of ['front', 'back', 'tests'] as const) {
    const values = record[key];
    if (!Array.isArray(values) || values.length === 0) return false;
    if (!values.every(isRelativePosix)) return false;
  }
  return true;
}

/**
 * validateManifestShape — shape mínimo portable del manifest. Un manifest
 * inválido o ausente ⇒ `not-applicable`: la proyección se salta como
 * `not-applicable/invalid` y NUNCA bloquea (ventana warn-first).
 */
export function validateManifestShape(input: unknown): ManifestApplicability {
  if (!input || typeof input !== 'object') {
    return { applicable: false, reason: 'not-applicable: manifest invalid or absent' };
  }
  const manifest = input as Record<string, unknown>;
  if (manifest['schemaVersion'] !== CODE_TRACEABILITY_SCHEMA) {
    return { applicable: false, reason: 'not-applicable: manifest invalid or absent' };
  }
  if (manifest['readOnly'] !== true) {
    return { applicable: false, reason: 'not-applicable: manifest invalid or absent' };
  }
  if (manifest['policyMode'] !== 'warn') {
    return { applicable: false, reason: 'not-applicable: manifest invalid or absent' };
  }
  if (!validateRoots(manifest['roots'])) {
    return { applicable: false, reason: 'not-applicable: manifest invalid or absent' };
  }
  return { applicable: true };
}

/**
 * orphanSeverity — el bloque huérfano (`ORPHAN_CODE_BLOCK`) es siempre
 * `warning`, nunca error. No endurecer a error en esta ventana (OPCIÓN A).
 */
export function orphanSeverity(): typeof ORPHAN_CODE_BLOCK_SEVERITY {
  return ORPHAN_CODE_BLOCK_SEVERITY;
}
