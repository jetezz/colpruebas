#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

export const PROJECTCTL_MODULES = Object.freeze({
  root: 'scripts/projectctl-root.ts',
  docs: 'scripts/projectctl-docs.ts',
  doctor: 'scripts/sdd-doctor.ts',
  taskflow: 'scripts/taskflow.ts',
  test: 'scripts/test-runner.ts',
} as const);

export type ProjectctlModuleId = keyof typeof PROJECTCTL_MODULES;

export class ProjectctlModuleError extends Error {
  constructor(readonly code: 'unknown_module' | 'module_not_found' | 'invalid_repo_root', message: string) {
    super(`${code}: ${message}`);
    this.name = 'ProjectctlModuleError';
  }
}

export function resolveProjectctlModule(moduleId: string, repoRoot: string): string {
  if (!(moduleId in PROJECTCTL_MODULES)) {
    throw new ProjectctlModuleError('unknown_module', moduleId);
  }
  const root = resolve(repoRoot);
  const path = resolve(root, PROJECTCTL_MODULES[moduleId as ProjectctlModuleId]);
  const relativePath = relative(root, path);
  if (isAbsolute(relativePath) || relativePath.startsWith('..')) {
    throw new ProjectctlModuleError('invalid_repo_root', root);
  }
  if (!existsSync(path)) {
    throw new ProjectctlModuleError('module_not_found', `${moduleId} -> ${relativePath}`);
  }
  return path;
}

if (import.meta.main) {
  const [moduleId] = process.argv.slice(2);
  if (!moduleId || moduleId === '--help' || moduleId === '-h') {
    console.log(`Usage: bun scripts/projectctl-module-resolver.ts <${Object.keys(PROJECTCTL_MODULES).join('|')}>`);
    process.exit(moduleId ? 0 : 2);
  }
  try {
    const path = resolveProjectctlModule(moduleId, resolve(import.meta.dir, '..'));
    console.log(path);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
