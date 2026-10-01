#!/usr/bin/env bun
/**
 * RDD satellite integrity check (skill surface only).
 *
 * Portable entrypoint for the `projectctl-rdd` satellite.
 * Validates (fail-closed, exit 0/1):
 *   - SKILL.md exists with frontmatter id/version/layer/type/sot/install/license
 *   - workflow-extension.json exists, parses, exposes lanes + gates + phase
 *     (shape-real: lanes{} non-empty, gates{} non-empty, phase{states[],transitions[]})
 *   - modules/ exists with at least one module.md
 *   - this file imports only node:fs / node:path (no core, no sandbox/, no frontend/)
 *
 * Portable: bun + node:fs + node:path only. No core imports.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const SKILL_REL = '.agents/skills/projectctl-rdd/SKILL.md';
const EXT_REL = '.agents/skills/projectctl-rdd/workflow-extension.json';
const MODULES_REL = '.agents/skills/projectctl-rdd/modules';

type Failure = string;

function extractFrontmatter(raw: string): string | null {
  const lines = raw.split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.slice(1).findIndex((line) => line.trim() === '---');
  if (end < 0) return null;
  return lines.slice(1, 1 + end).join('\n');
}

function checkFrontmatter(repoRoot: string, failures: Failure[]): void {
  const abs = resolve(repoRoot, SKILL_REL);
  if (!existsSync(abs)) {
    failures.push(`SKILL.md missing: ${SKILL_REL}`);
    return;
  }
  const raw = readFileSync(abs, 'utf8');
  const front = extractFrontmatter(raw);
  if (front === null) {
    failures.push(`SKILL.md frontmatter missing or unparseable: ${SKILL_REL}`);
    return;
  }
  const required: Array<{ key: string; re: RegExp }> = [
    { key: 'id', re: /^\s*id:\s*\S+/m },
    { key: 'version', re: /^\s*version:\s*\S+/m },
    { key: 'layer', re: /^\s*layer:\s*\S+/m },
    { key: 'type', re: /^\s*type:\s*\S+/m },
    { key: 'sot', re: /^\s*sot(_policy)?:\s*\S+/m },
    { key: 'install', re: /^\s*install:\s*\S+/m },
    { key: 'license', re: /^\s*license:\s*\S+/m },
  ];
  for (const { key, re } of required) {
    if (!re.test(front)) failures.push(`SKILL.md frontmatter missing key: ${key}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkExtension(repoRoot: string, failures: Failure[]): void {
  const abs = resolve(repoRoot, EXT_REL);
  if (!existsSync(abs)) {
    failures.push(`workflow-extension.json missing: ${EXT_REL}`);
    return;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(abs, 'utf8'));
  } catch (error) {
    failures.push(`workflow-extension.json unparseable: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  if (!isRecord(parsed)) {
    failures.push('workflow-extension.json must be a JSON object');
    return;
  }
  // Shape-real: this satellite declares lanes + gates + phase (no generic kind field).
  // Accept a `kind` alias only if a future shape introduces it; today require lanes/gates/phase.
  const hasKind = typeof parsed['kind'] === 'string' && (parsed['kind'] as string).trim().length > 0;
  const lanes = parsed['lanes'];
  const gates = parsed['gates'];
  const phase = parsed['phase'];
  const fases = parsed['fases'];
  if (!hasKind) {
    if (!isRecord(lanes) || Object.keys(lanes).length < 1) {
      failures.push('workflow-extension.json must declare a non-empty lanes map');
    }
    if (!isRecord(gates) || Object.keys(gates).length < 1) {
      failures.push('workflow-extension.json must declare a non-empty gates map');
    }
    const phaseObj: unknown = isRecord(phase) ? phase : isRecord(fases) ? fases : null;
    if (!isRecord(phaseObj)) {
      failures.push('workflow-extension.json must declare a phase object (phase or fases)');
    } else {
      const states = (phaseObj as Record<string, unknown>)['states'];
      const transitions = (phaseObj as Record<string, unknown>)['transitions'];
      if (!Array.isArray(states) || states.length < 1) {
        failures.push('workflow-extension.json phase must declare a non-empty states array');
      }
      if (!Array.isArray(transitions) || transitions.length < 1) {
        failures.push('workflow-extension.json phase must declare a non-empty transitions array');
      }
    }
  } else {
    // Future kind-shaped catalog: still require lanes/gates evidence when present.
    if (lanes !== undefined && (!isRecord(lanes) || Object.keys(lanes).length < 1)) {
      failures.push('workflow-extension.json lanes must be a non-empty map when present');
    }
    if (gates !== undefined && (!isRecord(gates) || Object.keys(gates).length < 1)) {
      failures.push('workflow-extension.json gates must be a non-empty map when present');
    }
  }
}

function collectModuleFiles(dir: string, out: string[]): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const abs = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(abs).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      collectModuleFiles(abs, out);
    } else if (entry === 'module.md') {
      out.push(abs);
    }
  }
}

function checkModules(repoRoot: string, failures: Failure[]): void {
  const abs = resolve(repoRoot, MODULES_REL);
  if (!existsSync(abs)) {
    failures.push(`modules/ missing: ${MODULES_REL}`);
    return;
  }
  try {
    if (!statSync(abs).isDirectory()) {
      failures.push(`modules/ is not a directory: ${MODULES_REL}`);
      return;
    }
  } catch (error) {
    failures.push(`modules/ unreadable: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  const found: string[] = [];
  collectModuleFiles(abs, found);
  if (found.length < 1) {
    failures.push(`modules/ must contain at least one module.md: ${MODULES_REL}`);
  }
}

function checkSelfPortability(failures: Failure[]): void {
  const self = readFileSync(resolve(import.meta.dir, 'rdd-check.ts'), 'utf8');
  const lines = self.split(/\r?\n/);
  const importLines = lines.filter((line) => /^\s*import\b/.test(line) || /\bfrom\s+['"]/.test(line));
  for (const line of importLines) {
    const match = line.match(/from\s+['"]([^'"]+)['"]/);
    const spec = match?.[1] ?? '';
    // Portable allow-list: sibling-relative only for docs (none today) is forbidden;
    // runtime imports must be node:fs or node:path only.
    if (spec.startsWith('node:fs') || spec.startsWith('node:path')) continue;
    failures.push(`rdd-check imports non-portable specifier: ${line.trim().slice(0, 120)}`);
  }
  const forbiddenTokens = ['sandbox/', 'frontend/', 'projectctl-requirements', 'projectctl-sdd', '.atl/', '.opencode/'];
  for (const token of forbiddenTokens) {
    const hits = importLines.filter((line) => line.includes(token));
    for (const hit of hits) {
      failures.push(`rdd-check imports forbidden target ${token}: ${hit.trim().slice(0, 120)}`);
    }
  }
}

export function checkRdd(repoRoot: string = resolve(import.meta.dir, '../../../../..')): {
  ok: boolean;
  failures: string[];
} {
  const failures: Failure[] = [];
  checkFrontmatter(repoRoot, failures);
  checkExtension(repoRoot, failures);
  checkModules(repoRoot, failures);
  checkSelfPortability(failures);
  return { ok: failures.length === 0, failures };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: bun .agents/skills/projectctl-rdd/scripts/skill/rdd-check.ts --check');
    process.exit(0);
  }
  const repoRoot = resolve(import.meta.dir, '../../../../..');
  const report = checkRdd(repoRoot);
  if (report.ok) {
    console.log('[rdd-check] ok — SKILL.md + workflow-extension.json + modules/');
    process.exit(0);
  }
  for (const failure of report.failures) console.error(`[rdd-check] FAIL ${failure}`);
  process.exit(1);
}
