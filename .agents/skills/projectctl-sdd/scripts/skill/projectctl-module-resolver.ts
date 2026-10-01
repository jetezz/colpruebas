#!/usr/bin/env bun
/**
 * scripts/projectctl-module-resolver.ts
 *
 * WU-03C (`sdd-apply-code-high`, task 20260908-pctmap) — exact MAP lookup
 * from a logical lane/module id. No scan of `modules/`, no alias, symlink,
 * shim or fallback.
 *
 * Public API:
 *   resolveProjectctlModule(logicalId, options)
 *   resolveLaneModulePath(binding, laneId, options)
 *
 * Closed errors: `lane_not_registered`, `module_not_found`,
 * `module_revision_mismatch`.
 */

import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import {
  DEFAULT_MAP_PATH,
  MAP_SCHEMA_ID,
  lookupMapRow,
  parseProjectctlMap,
  sha256OfString,
  type MapRow,
  type ParsedMap,
} from './sdd-map';

export const MODULE_RESOLVER_ERRORS = Object.freeze([
  'lane_not_registered',
  'module_not_found',
  'module_revision_mismatch',
] as const);

export type ModuleResolverErrorCode = (typeof MODULE_RESOLVER_ERRORS)[number];

export class ProjectctlModuleResolverError extends Error {
  readonly code: ModuleResolverErrorCode;
  readonly logicalId: string;

  constructor(code: ModuleResolverErrorCode, logicalId: string, detail: string) {
    super(`${code}:${logicalId}${detail ? ` ${detail}` : ''}`);
    this.name = 'ProjectctlModuleResolverError';
    this.code = code;
    this.logicalId = logicalId;
  }
}

export interface ResolvedProjectctlModule {
  readonly moduleId: string;
  readonly modulePath: string;
  readonly authority: string;
  readonly requiredSkillPaths: readonly string[];
  readonly mapRevision: string;
}

export interface ResolveModuleOptions {
  readonly repoRoot: string;
  readonly mapPath?: string;
  readonly map?: ParsedMap;
  readonly laneRegistry?: ReadonlySet<string> | readonly string[];
}

const SD_PROTOCOL_SIBLINGS = Object.freeze([
  'acceptance-criteria-gates.md',
  'apply-lane-common.md',
  'apply-work-unit-schema.md',
  'explorer-rules.md',
  'persistence-contract.md',
  'sdd-phase-common.md',
  'sdd-verify-common.md',
  'skill-resolver.md',
  'strict-tdd.md',
  'workflow-runtime-context.md',
] as const);

export const SD_PROTOCOL_MODULE_DIR =
  '.agents/skills/projectctl-sdd/modules/sd-protocol' as const;

function repoRelative(repoRoot: string, relativePath: string): string {
  if (isAbsolute(relativePath)) {
    throw new ProjectctlModuleResolverError(
      'module_not_found',
      relativePath,
      'absolute paths are forbidden',
    );
  }
  if (relativePath.split(/[\\/]/).includes('..')) {
    throw new ProjectctlModuleResolverError(
      'module_not_found',
      relativePath,
      'parent traversal is forbidden',
    );
  }
  const absolute = resolve(repoRoot, relativePath.split(/[\\/]/).join(sep));
  const rel = relative(repoRoot, absolute).split('\\').join('/');
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new ProjectctlModuleResolverError(
      'module_not_found',
      relativePath,
      'path escapes repo root',
    );
  }
  return rel;
}

function loadMap(repoRoot: string, mapPath: string, provided?: ParsedMap): ParsedMap {
  if (provided) return provided;
  const absolute = resolve(repoRoot, mapPath);
  if (!existsSync(absolute)) {
    throw new ProjectctlModuleResolverError('module_not_found', mapPath, 'MAP.md is missing');
  }
  const parsed = parseProjectctlMap(readFileSync(absolute, 'utf8'), repoRoot, mapPath);
  if (!parsed.map) {
    throw new ProjectctlModuleResolverError(
      'module_revision_mismatch',
      mapPath,
      parsed.issues.map((issue) => `${issue.key}:${issue.got}`).join('; ') || 'MAP unreadable',
    );
  }
  if (parsed.issues.some((issue) => issue.code === 'source_revision_mismatch')) {
    throw new ProjectctlModuleResolverError(
      'module_revision_mismatch',
      mapPath,
      'MAP source_revision does not match table digest',
    );
  }
  return parsed.map;
}

function assertMapRevision(map: ParsedMap): void {
  const tableCanonical = map.rows
    .map((row) =>
      [row.id, row.modulo, row.proposito, row.autoridad, row.path ?? '', row.kind ?? '', row.status].join('|'),
    )
    .join('\n');
  const expected = sha256OfString(`${MAP_SCHEMA_ID}\n${tableCanonical}\n`);
  if (map.source_revision !== expected) {
    throw new ProjectctlModuleResolverError(
      'module_revision_mismatch',
      map.source_revision,
      `expected ${expected}`,
    );
  }
}

function siblingPaths(modulePath: string): string[] {
  if (modulePath === `${SD_PROTOCOL_MODULE_DIR}/module.md`) {
    return SD_PROTOCOL_SIBLINGS.map((name) => `${SD_PROTOCOL_MODULE_DIR}/${name}`);
  }
  return [];
}

export function resolveProjectctlModule(
  logicalId: string,
  options: ResolveModuleOptions,
): ResolvedProjectctlModule {
  if (!logicalId || logicalId.includes('/') || logicalId.includes('..')) {
    throw new ProjectctlModuleResolverError('lane_not_registered', logicalId, 'invalid logical id');
  }
  if (options.laneRegistry) {
    const registry = options.laneRegistry instanceof Set
      ? options.laneRegistry
      : new Set(options.laneRegistry);
    if (!registry.has(logicalId)) {
      throw new ProjectctlModuleResolverError(
        'lane_not_registered',
        logicalId,
        'absent from lane registry',
      );
    }
  }

  const mapPath = options.mapPath ?? DEFAULT_MAP_PATH;
  const map = loadMap(options.repoRoot, mapPath, options.map);
  assertMapRevision(map);

  const row: MapRow | null = lookupMapRow(map, logicalId);
  if (!row) {
    throw new ProjectctlModuleResolverError('lane_not_registered', logicalId, 'no exact MAP row');
  }
  if (row.status !== 'current') {
    throw new ProjectctlModuleResolverError(
      'module_not_found',
      logicalId,
      `MAP status=${row.status} is not resolvable`,
    );
  }

  const modulePath = repoRelative(options.repoRoot, row.modulo);
  const absolute = resolve(options.repoRoot, modulePath);
  if (!existsSync(absolute)) {
    throw new ProjectctlModuleResolverError('module_not_found', logicalId, modulePath);
  }

  const requiredSkillPaths = [modulePath, ...siblingPaths(modulePath)];
  for (const sibling of requiredSkillPaths.slice(1)) {
    if (!existsSync(resolve(options.repoRoot, sibling))) {
      throw new ProjectctlModuleResolverError('module_not_found', logicalId, sibling);
    }
  }

  return {
    moduleId: row.id,
    modulePath,
    authority: row.autoridad,
    requiredSkillPaths: Object.freeze(requiredSkillPaths),
    mapRevision: map.source_revision,
  };
}

export function resolveLaneModulePath(
  binding: Record<string, unknown>,
  laneId: string,
  options: ResolveModuleOptions,
): ResolvedProjectctlModule {
  const lanes = (binding.lanes ?? {}) as Record<string, { skill?: string }>;
  const lane = lanes[laneId];
  if (!lane?.skill) {
    throw new ProjectctlModuleResolverError(
      'lane_not_registered',
      laneId,
      'binding lane has no logical skill',
    );
  }
  const extension = (binding.extension_lane_modules as Record<string, { path: string; authority: string; revision: string }> | undefined)?.[laneId];
  if (extension) {
    const modulePath = repoRelative(options.repoRoot, extension.path);
    const absolute = resolve(options.repoRoot, modulePath);
    if (!modulePath.startsWith('.agents/skills/') || !existsSync(absolute)
      || realpathSync(absolute) !== absolute || lstatSync(absolute).isSymbolicLink()) {
      throw new ProjectctlModuleResolverError('module_not_found', laneId, 'selected extension module missing');
    }
    return { moduleId: laneId, modulePath, authority: extension.authority, requiredSkillPaths: [modulePath], mapRevision: extension.revision };
  }
  return resolveProjectctlModule(laneId, {
    ...options,
    laneRegistry: Object.keys(lanes),
  });
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const logicalId = argv.find((arg) => !arg.startsWith('--')) ?? '';
  if (!logicalId || argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: bun scripts/skill/projectctl-module-resolver.ts <logicalId>');
    process.exit(logicalId ? 0 : 2);
  }
  const repoRoot = resolve(import.meta.dir, '../../../../..');
  try {
    const resolved = resolveProjectctlModule(logicalId, { repoRoot });
    console.log(
      [
        `[projectctl-module-resolver] ok — ${resolved.moduleId} -> ${resolved.modulePath}`,
        `[projectctl-module-resolver] authority=${resolved.authority} revision=${resolved.mapRevision}`,
        `[projectctl-module-resolver] required=${resolved.requiredSkillPaths.join(',')}`,
      ].join('\n'),
    );
  } catch (error) {
    const code = error instanceof ProjectctlModuleResolverError ? error.code : 'module_not_found';
    console.error(`[projectctl-module-resolver] ${code} ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
