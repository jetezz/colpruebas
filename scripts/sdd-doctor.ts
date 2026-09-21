#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { inspectDocs } from './projectctl-docs.ts';
import { checkTaskflow } from './taskflow.ts';

const REPO_ROOT = resolve(import.meta.dir, '..');
const REQUIRED_FILES = ['package.json', 'scripts/test-runner.ts', 'docs/app-map/navigation.yaml'];

export function runDoctor(repoRoot = REPO_ROOT): { errors: string[] } {
  const errors = REQUIRED_FILES.filter((file) => !existsSync(join(repoRoot, file))).map((file) => `${file}: required file is missing`);
  errors.push(...inspectDocs(repoRoot).errors, ...checkTaskflow(repoRoot));
  return { errors };
}

function main(): number {
  const report = runDoctor();
  for (const error of report.errors) console.error(`❌ ${error}`);
  if (report.errors.length > 0) {
    console.error(`\nSDD doctor failed with ${report.errors.length} issue(s).`);
    return 1;
  }
  console.log('✅ SDD static doctor passed (home-only profile).');
  return 0;
}

if (import.meta.main) process.exitCode = main();
