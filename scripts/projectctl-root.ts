#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const scripts: Record<string, string> = {
  docs: 'projectctl-docs.ts',
  doctor: 'sdd-doctor.ts',
  'sdd:doctor': 'sdd-doctor.ts',
  taskflow: 'taskflow.ts',
  test: 'test-runner.ts',
};

function run(script: string, args: string[]): Promise<number> {
  return new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, [resolve(import.meta.dir, script), ...args], {
      cwd: REPO_ROOT,
      env: process.env,
      shell: false,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) => resolveExit(code ?? 1));
  });
}

async function main(argv = process.argv.slice(2)): Promise<number> {
  const [command, ...args] = argv;
  if (command === 'docs') return run(scripts.docs, args);
  if (command === 'sdd' && args[0] === 'doctor') return run(scripts.doctor, args.slice(1));
  if (command === 'doctor') return run(scripts.doctor, args);
  if (command === 'taskflow') return run(scripts.taskflow, args);
  if (command === 'test') return run(scripts.test, args);
  console.error('Usage: bun scripts/projectctl-root.ts <docs|sdd doctor|taskflow|test> ...');
  return 2;
}

main().then((code) => { process.exitCode = code; }, (error) => {
  console.error(`projectctl: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
