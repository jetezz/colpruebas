#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const WORKFLOW_LOCATOR = '.agents/sdd-workflow.json';

type WorkflowLocator = {
  projections?: {
    client_view_model?: unknown;
    client_generated_ts?: unknown;
  };
};

function generatedProjectionPaths(repoRoot: string): { paths: string[]; errors: string[] } {
  const locatorPath = join(repoRoot, WORKFLOW_LOCATOR);
  if (!existsSync(locatorPath)) return { paths: [], errors: [`${WORKFLOW_LOCATOR}: workflow locator is missing`] };

  let locator: WorkflowLocator;
  try {
    locator = JSON.parse(readFileSync(locatorPath, 'utf8')) as WorkflowLocator;
  } catch {
    return { paths: [], errors: [`${WORKFLOW_LOCATOR}: workflow locator is not valid JSON`] };
  }

  const values = [locator.projections?.client_view_model, locator.projections?.client_generated_ts];
  const paths = values.filter((value): value is string => typeof value === 'string' && value.length > 0);
  if (paths.length !== values.length) return { paths, errors: [`${WORKFLOW_LOCATOR}: client projection paths are missing`] };
  return { paths, errors: [] };
}

export function checkTaskflow(repoRoot = REPO_ROOT): string[] {
  const projections = generatedProjectionPaths(repoRoot);
  const errors = [...projections.errors];
  for (const file of projections.paths) {
    const absolute = join(repoRoot, file);
    if (!existsSync(absolute)) {
      errors.push(`${file}: generated projection is missing`);
      continue;
    }
    const content = readFileSync(absolute, 'utf8');
    if (!content.includes('AUTO-GENERATED') || !content.includes('do not edit by hand')) {
      errors.push(`${file}: generated-file marker is missing`);
    }
    if (!content.includes('task-flow-binding')) errors.push(`${file}: task-flow-binding source marker is missing`);
  }
  return errors;
}

function main(argv = process.argv.slice(2)): number {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log('Usage: bun scripts/taskflow.ts [--check|--generate]');
    return 0;
  }
  const generate = argv.includes('--generate');
  if (generate) {
    console.error('taskflow:generate requires the canonical task-flow-binding source; no source is installed in this home-only repo');
    return 1;
  }
  const errors = checkTaskflow();
  for (const error of errors) console.error(`❌ ${error}`);
  if (errors.length > 0) return 1;
  console.log('✅ taskflow:check passed; generated projections are intact');
  return 0;
}

if (import.meta.main) process.exitCode = main();
