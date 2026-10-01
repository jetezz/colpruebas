#!/usr/bin/env bun
/**
 * Core portable check for schemas, MAP, criteria and coverage ledger.
 *
 * Portable entrypoint for the `projectctl-requirements` skill.
 * Validates (fail-closed, exit 0/1):
 *   - JSON schemas exist and parse (criteria / ledger / manifest)
 *   - MAP `source_revision` matches its table (via parseProjectctlMap)
 *   - criteria.yaml / coverage-ledger.yaml revisions are well-formed and
 *     cross-consistent (ledger.criteria_revision == criteria.source_revision)
 *   - this file has ZERO imports to frontend/, .atl/, .opencode/, sandbox/
 *
 * Portable: Bun stdlib + sibling MAP parser. YAML uses Bun.YAML.parse.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CRITERION_ID_PATTERN, CRITERION_TYPES } from '../project/criterion-contract.ts';
import { checkProjectctlCriteriaIntegrity } from './projectctl-criteria-integrity.ts';

import {
  parseProjectctlMap,
} from './projectctl-map.ts';

const REPO_ROOT = resolve(import.meta.dir, '../../../../..');

const SCHEMA_FILES = [
  '.agents/skills/projectctl-requirements/references/schemas/criteria.schema.json',
  '.agents/skills/projectctl-requirements/references/schemas/coverage-ledger.schema.json',
] as const;

const CRITERIA_PATH = '.agents/skills/projectctl-requirements/references/app-map/criteria.yaml';
const LEDGER_PATH = '.agents/skills/projectctl-requirements/references/app-map/coverage-ledger.yaml';
const MAP_PATH = '.agents/skills/projectctl-requirements/MAP.md';

const SHA256_RE = /^[a-f0-9]{64}$/;

type Failure = string;

function sha256OfString(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function checkSchemas(repoRoot: string, failures: Failure[]): void {
  for (const rel of SCHEMA_FILES) {
    const abs = resolve(repoRoot, rel);
    if (!existsSync(abs)) {
      failures.push(`schema missing: ${rel}`);
      continue;
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(abs, 'utf8'));
      if (parsed === null || typeof parsed !== 'object') failures.push(`schema not an object: ${rel}`);
    } catch (error) {
      failures.push(`schema unparseable ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

function checkMap(repoRoot: string, failures: Failure[]): void {
  const abs = resolve(repoRoot, MAP_PATH);
  if (!existsSync(abs)) {
    failures.push(`map missing: ${MAP_PATH}`);
    return;
  }
  const raw = readFileSync(abs, 'utf8');
  const result = parseProjectctlMap(raw, repoRoot, MAP_PATH);
  if (!result.ok) {
    for (const issue of result.issues) {
      failures.push(`map ${issue.code} ${issue.key} expected=${issue.expected} got=${issue.got}`);
    }
  }
}

function parseYamlFile(repoRoot: string, rel: string, failures: Failure[]): Record<string, unknown> | null {
  const abs = resolve(repoRoot, rel);
  if (!existsSync(abs)) {
    failures.push(`yaml missing: ${rel}`);
    return null;
  }
  const raw = readFileSync(abs, 'utf8');
  try {
    const parsed = Bun.YAML.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      failures.push(`yaml not a mapping: ${rel}`);
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    failures.push(`yaml unparseable ${rel}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function checkCriteriaLedger(repoRoot: string, failures: Failure[]): void {
  const criteria = parseYamlFile(repoRoot, CRITERIA_PATH, failures);
  const ledger = parseYamlFile(repoRoot, LEDGER_PATH, failures);
  if (criteria) {
    if (criteria['schema'] !== 'projectctl-criteria/v1') {
      failures.push(`criteria schema mismatch: got=${JSON.stringify(criteria['schema'])}`);
    }
    const rev = criteria['source_revision'];
    if (typeof rev !== 'string' || !SHA256_RE.test(rev)) {
      failures.push(`criteria source_revision must be sha256 hex: ${CRITERIA_PATH}`);
    }
    if (!Array.isArray(criteria['criteria']) || (criteria['criteria'] as unknown[]).length < 1) {
      failures.push(`criteria.criteria must be a non-empty array: ${CRITERIA_PATH}`);
    }
  }
  if (ledger) {
    if (ledger['schema'] !== 'projectctl-coverage-ledger/v1') {
      failures.push(`ledger schema mismatch: got=${JSON.stringify(ledger['schema'])}`);
    }
    const rev = ledger['source_revision'];
    if (typeof rev !== 'string' || !SHA256_RE.test(rev)) {
      failures.push(`ledger source_revision must be sha256 hex: ${LEDGER_PATH}`);
    }
    const criteriaRev = ledger['criteria_revision'];
    if (typeof criteriaRev !== 'string' || !SHA256_RE.test(criteriaRev)) {
      failures.push(`ledger criteria_revision must be sha256 hex: ${LEDGER_PATH}`);
    } else if (criteria && typeof criteria['source_revision'] === 'string' && criteriaRev !== criteria['source_revision']) {
      failures.push(`ledger criteria_revision drift: ledger=${criteriaRev} criteria=${criteria['source_revision']}`);
    }
    if (!Array.isArray(ledger['entries'])) {
      failures.push(`ledger entries must be an array: ${LEDGER_PATH}`);
    }
  }
}

function checkSelfPortability(failures: Failure[]): void {
  const self = readFileSync(resolve(import.meta.dir, 'requirements-check.ts'), 'utf8');
  const forbidden = ['frontend/', '.atl/', '.opencode/', 'sandbox/'];
  for (const token of forbidden) {
    // Allow the token only inside this portability block's own literal list.
    const occurrences = self.split(token).length - 1;
    const allowedInSelfCheck = token === 'frontend/' || token === '.atl/' || token === '.opencode/' || token === 'sandbox/' ? 1 : 0;
    void allowedInSelfCheck;
    // Count import/from lines containing the token — those are hard violations.
    const importLines = self.split(/\r?\n/).filter((line) => /^\s*import\b|^\s*}\s*from\s|from\s+['"]/.test(line) && line.includes(token));
    if (importLines.length > 0) {
      failures.push(`requirements-check imports forbidden prefix ${token}: ${importLines[0]?.trim().slice(0, 120)}`);
    }
    void occurrences;
  }
  if (/from\s+['"][^'"]*sandbox\//.test(self)) failures.push('requirements-check must not import sandbox/');
  if (/from\s+['"][^'"]*frontend\//.test(self)) failures.push('requirements-check must not import frontend/');
  if (/\.atl\//.test(self.split('forbidden')[0] ?? '')) {
    // The only allowed .atl/ mention is inside the forbidden list below; imports already checked above.
  }
}

export function checkRequirements(repoRoot: string = REPO_ROOT): { ok: boolean; failures: string[]; digest: Record<string, string | null> } {
  const failures: Failure[] = [];
  checkSchemas(repoRoot, failures);
  checkMap(repoRoot, failures);
  checkCriteriaLedger(repoRoot, failures);
  for (const issue of checkProjectctlCriteriaIntegrity(repoRoot).issues) failures.push(`criteria integrity ${issue.code} ${issue.path} ${issue.key}: expected=${issue.expected} got=${issue.got}`);
  checkSelfPortability(failures);
  try {
    const schema = JSON.parse(readFileSync(resolve(repoRoot, SCHEMA_FILES[0]), 'utf8'));
    if (schema.$defs.criterion.properties.id.pattern !== CRITERION_ID_PATTERN) failures.push('criterion ID schema drift from common core contract');
    if (JSON.stringify(schema.$defs.criterion.properties.type.enum) !== JSON.stringify(CRITERION_TYPES)) failures.push('criterion type schema drift from common core contract');
    for (const rel of ['scripts/project/criterion-contract.ts', 'scripts/project/app-map-inventory.ts', 'references/criterios/identity.md']) {
      if (!existsSync(resolve(repoRoot, '.agents/skills/projectctl-requirements', rel))) failures.push(`canonical criteria contract missing: ${rel}`);
    }
  } catch (error) { failures.push(`canonical criteria contract invalid: ${String(error)}`); }
  const digest: Record<string, string | null> = {};
  for (const rel of [MAP_PATH, CRITERIA_PATH, LEDGER_PATH]) {
    const abs = resolve(repoRoot, rel);
    digest[rel] = existsSync(abs) ? sha256OfString(readFileSync(abs, 'utf8')) : null;
  }
  return { ok: failures.length === 0, failures, digest };
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: bun .agents/skills/projectctl-requirements/scripts/skill/requirements-check.ts [--check]');
    process.exit(0);
  }
  const repoRoot = resolve(import.meta.dir, '../../../../..');
  const report = checkRequirements(repoRoot);
  if (report.ok) {
    console.log('[requirements-check] ok — shared criterion identity + schemas + MAP + criteria/ledger integrity');
    console.log(`[requirements-check] digest map=${report.digest[MAP_PATH]} criteria=${report.digest[CRITERIA_PATH]} ledger=${report.digest[LEDGER_PATH]}`);
    process.exit(0);
  }
  for (const failure of report.failures) console.error(`[requirements-check] FAIL ${failure}`);
  process.exit(1);
}
