/**
 * app-map-format.ts — Normalizador portable de `docs/app-map/**` frontmatter.
 *
 * Paquete `projectctl-requirements` (portable, copy-tree-no-mods). Lógica pura
 * de frontmatter/canonical JSON, inyectable por `repoRoot`/`appMapGlob`; este
 * archivo NO tiene ningún import estático hacia `sandbox/` (la pureza del
 * formatter es autocontenida y el filesystem se parametriza por opciones).
 *
 * Env:
 *   REPO_ROOT     (default: raíz del repo que contiene esta skill)
 *   APP_MAP_GLOB  (default: glob de bundles docs/app-map)
 *
 * El wrapper local `<repo>/scripts/...` (proveído por el destino) es un wrapper
 * fino que re-exporta este módulo; el script de formato sigue funcionando vía
 * ese wrapper. La suite portable vive en
 * `scripts/__tests__/app-map-format.portable.test.ts` (factory
 * `defineAppMapFormatSuite`, inyectable, sin import estático a `sandbox/`).
 *
 * Normaliza de forma determinista sin tocar la semántica:
 *  1. Saltos/márgenes (Tier 0): CRLF/CR → LF, trailing whitespace, 1 línea en
 *     blanco consecutiva como máximo, exactamente un `\n` final.
 *  2. Indentación del subtree `criteria` (Tier 1): items `- id:` en 2, keys de
 *     item en 4, valores de `coverage` en 6; scalars block realineados.
 *  3. `coverage: {…}` inline → block (Tier 2): el parser estricto del runtime
 *     lee un inline map como STRING; expandirlo corrige formato y dato.
 *
 * No toca el body markdown, ni `navigation.yaml`, ni keys fuera del subtree
 * `criteria`. Idempotente: una segunda pasada no cambia nada.
 *
 * Uso:
 *   bun <skill>/scripts/project/app-map-format.ts            # escribe cambios en disco
 *   bun <skill>/scripts/project/app-map-format.ts --check    # reporta sin escribir; exit 1 si hay
 *   (el destino puede exponer un wrapper local `<repo>/scripts/...` que lo re-exporte)
 *
 * Cumple: PCT-83..88 (tab Doc: bundles canónicos renderizables).
 * last-verified: 2026-09-27
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

// ---- pure formatter (autocontenido; el wrapper local del destino lo re-exporta) ----

type RawLine = { indent: number; text: string };

const ITEM_KEY_RE = /^(id|title|functional|coverage|notes|contracts|skip_quality_gate):/;
const COVERAGE_METHOD_RE = /^(Unit|PW-CLI|PW-AUTO|Manual):/;
const INLINE_COVERAGE_RE = /^coverage:\s*\{(.*)\}\s*$/;
const BLOCK_SCALAR_INDICATOR_RE = /^[>|][+-]?\d*$/;

function classifyLine(raw: string): RawLine {
  const match = raw.match(/^(\s*)(.*)$/);
  return { indent: match?.[1]?.length ?? 0, text: match?.[2] ?? '' };
}

export function normalizeFileText(text: string): string {
  let out = text.replace(/\r\n?/g, '\n');
  out = out.replace(/[ \t]+$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/\s+$/, '') + '\n';
  return out;
}

function emitScalarBlock(lines: string[], start: number, parentIndent: number, out: string[]): number {
  const content: Array<RawLine | null> = [];
  let i = start;
  while (i < lines.length) {
    const raw = classifyLine(lines[i]);
    const trimmed = raw.text.trim();
    if (!trimmed) {
      content.push(null);
      i += 1;
      continue;
    }
    if (raw.indent <= parentIndent) break;
    if (raw.indent === parentIndent + 1 && ITEM_KEY_RE.test(trimmed)) break;
    content.push(raw);
    i += 1;
  }

  const targetBase = parentIndent + 2;
  const nonBlank = content.filter((c): c is RawLine => c !== null);
  if (nonBlank.length === 0) return i;
  const minIndent = Math.min(...nonBlank.map((c) => c.indent));
  for (const c of content) {
    if (c === null) out.push('');
    else out.push(`${' '.repeat(Math.max(c.indent - minIndent + targetBase, 0))}${c.text}`);
  }
  return i;
}

function emitCoverage(method: string, state: string, out: string[]): void {
  out.push(`      ${method}: ${state}`);
}

function normalizeItemBody(lines: string[], start: number, out: string[]): number {
  const ITEM_KEY_INDENT = 4;
  const COVERAGE_VALUE_INDENT = 6;
  let i = start;
  while (i < lines.length) {
    const raw = classifyLine(lines[i]);
    const trimmed = raw.text.trim();
    if (!trimmed) {
      out.push('');
      i += 1;
      continue;
    }
    if (trimmed.startsWith('- ')) {
      if (raw.indent <= 3) return i;
      out.push(lines[i]);
      i += 1;
      continue;
    }
    if (raw.indent === 0) return i;
    if (COVERAGE_METHOD_RE.test(trimmed)) {
      out.push(`${' '.repeat(COVERAGE_VALUE_INDENT)}${trimmed}`);
      i += 1;
      continue;
    }

    i += 1;
    const inline = trimmed.match(INLINE_COVERAGE_RE);
    if (inline) {
      const pairs: Array<[string, string]> = [];
      for (const part of inline[1].split(',')) {
        const kv = part.match(/^\s*(Unit|PW-CLI|PW-AUTO|Manual)\s*:\s*(\S+)\s*$/);
        if (kv) pairs.push([kv[1], kv[2]]);
      }
      out.push(`${' '.repeat(ITEM_KEY_INDENT)}coverage:`);
      if (pairs.length > 0) {
        for (const [method, state] of pairs) emitCoverage(method, state, out);
        continue;
      }
    }
    out.push(`${' '.repeat(ITEM_KEY_INDENT)}${trimmed}`);
    const value = trimmed.slice(trimmed.indexOf(':') + 1).trim();
    if (value && BLOCK_SCALAR_INDICATOR_RE.test(value)) i = emitScalarBlock(lines, i, ITEM_KEY_INDENT, out);
  }
  return i;
}

export function normalizeCriteriaSubtree(frontmatter: string): string {
  const lines = frontmatter.split('\n');
  const criteriaIndex = lines.findIndex((line) => line.trim() === 'criteria:');
  if (criteriaIndex === -1) return frontmatter;
  let end = criteriaIndex + 1;
  while (end < lines.length) {
    const raw = classifyLine(lines[end]);
    if (raw.indent === 0 && raw.text.trim() !== '') break;
    end += 1;
  }
  const normalized: string[] = [];
  let i = criteriaIndex + 1;
  while (i < end) {
    const raw = classifyLine(lines[i]);
    const trimmed = raw.text.trim();
    if (!trimmed) {
      normalized.push('');
      i += 1;
      continue;
    }
    if (!trimmed.startsWith('- ')) {
      normalized.push(lines[i]);
      i += 1;
      continue;
    }
    normalized.push(`  ${trimmed}`);
    i += 1;
    i = normalizeItemBody(lines, i, normalized);
  }
  return [...lines.slice(0, criteriaIndex + 1), ...normalized, ...lines.slice(end)].join('\n');
}

export function normalizeMarkdown(text: string): string {
  const normalized = normalizeFileText(text);
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return normalized;
  return normalized.replace(match[1], () => normalizeCriteriaSubtree(match[1]));
}

// ---- runner inyectable ------------------------------------------------------

export type AppMapFormatOptions = {
  repoRoot: string;
  appMapGlob: string;
};

export type AppMapFormatResult = {
  changed: string[];
};

export async function collectAppMapFiles(options: AppMapFormatOptions): Promise<string[]> {
  return globby(options.appMapGlob, { cwd: options.repoRoot });
}

export async function formatAppMapFiles(
  options: AppMapFormatOptions & { check: boolean },
): Promise<AppMapFormatResult> {
  const files = await collectAppMapFiles(options);
  const changed: string[] = [];

  for (const file of files) {
    const fullPath = path.join(options.repoRoot, file);
    const original = await fs.readFile(fullPath, 'utf8');
    const formatted = normalizeMarkdown(original);
    if (formatted === original) continue;

    changed.push(file);
    if (options.check) {
      console.log(`[would reformat] ${file}`);
    } else {
      await fs.writeFile(fullPath, formatted);
      console.log(`[reformatted] ${file}`);
    }
  }

  const summary = options.check
    ? `app-map-format: ${changed.length} file(s) would change${changed.length > 0 ? ' (run without --check to apply)' : ''}.`
    : `app-map-format: ${changed.length} file(s) reformatted.`;
  console.log(summary);
  return { changed };
}

// ---- CLI (instancia; sin imports estáticos a `sandbox/`) --------------------

const DEFAULT_APP_MAP_GLOB = 'docs/app-map/**/*.md';

export function resolveAppMapFormatOptions(repoRoot?: string, appMapGlob?: string): AppMapFormatOptions {
  return {
    repoRoot: repoRoot ?? process.env.REPO_ROOT ?? path.resolve(import.meta.dir, '..', '..', '..', '..', '..'),
    appMapGlob: appMapGlob ?? process.env.APP_MAP_GLOB ?? DEFAULT_APP_MAP_GLOB,
  };
}

export async function runAppMapFormatCli(repoRoot?: string, appMapGlob?: string): Promise<void> {
  const check = process.argv.includes('--check');
  try {
    const { changed } = await formatAppMapFiles({ ...resolveAppMapFormatOptions(repoRoot, appMapGlob), check });
    if (check && changed.length > 0) process.exit(1);
  } catch (err) {
    console.error('app-map-format failed:', err);
    process.exit(1);
  }
}

if (import.meta.main) {
  await runAppMapFormatCli();
}
