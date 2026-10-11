#!/usr/bin/env bun
import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { loadStructure } from './structure-contract.ts';

function within(root: string, path: string): boolean {
  const rel = relative(root, path);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`);
}

function main() {
  const argv = process.argv.slice(2);
  let root = process.cwd();
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      console.log('Check that mapped implementation paths exist.\n\nUsage: bun check-paths.ts [--root DIR] [--json]');
      return;
    }
    if (arg === '--json') { json = true; continue; }
    if (arg === '--root' || arg.startsWith('--root=')) {
      const value = arg === '--root' ? argv[++i] : arg.slice('--root='.length);
      if (!value || value.startsWith('--')) { console.error('Missing value for --root'); process.exit(2); }
      root = resolve(value);
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    process.exit(2);
  }

  const structureScript = resolve(import.meta.dir, './validate-structure.ts');
  const proc = Bun.spawnSync(['bun', structureScript, '--root', root, '--json'], { stdout: 'pipe', stderr: 'pipe' });
  const procStdout = proc.stdout.toString();
  const procStderr = proc.stderr.toString();
  if (proc.exitCode !== 0) {
    const message = (procStderr || procStdout || 'structure validation failed').trim();
    if (json) console.log(JSON.stringify({ valid: false, issues: [{ path: 'structure prerequisite', message }] }, null, 2));
    else console.error(`Cannot check paths until structure maps pass: ${message}`);
    process.exit(1);
  }

  const result = loadStructure(root);
  const issues = [...result.issues];
  let rootReal: string;
  try { rootReal = realpathSync(root); }
  catch { rootReal = resolve(root); }
  for (const mapped of result.paths) {
    let current = rootReal;
    for (const segment of mapped.path.split('/')) {
      current = join(current, segment);
      if (!within(rootReal, current)) {
        issues.push({ path: mapped.sourceFile, message: `${mapped.criterionId}: path escapes project root: ${mapped.path}` });
        break;
      }
      try {
        const stat = lstatSync(current);
        if (stat.isSymbolicLink()) {
          issues.push({ path: mapped.sourceFile, message: `${mapped.criterionId}: symlink is not allowed in path ${mapped.path}` });
          break;
        }
      } catch {
        issues.push({ path: mapped.sourceFile, message: `${mapped.criterionId}: path does not exist: ${mapped.path}` });
        break;
      }
    }
  }

  if (json) console.log(JSON.stringify({ valid: issues.length === 0, checkedPaths: result.paths.length, issues }, null, 2));
  else if (!issues.length) console.log(`All ${result.paths.length} mapped path(s) exist within the project.`);
  else {
    console.error(`Found ${issues.length} issue(s):`);
    for (const issue of issues) console.error(`- ${issue.path}: ${issue.message}`);
  }
  process.exit(issues.length ? 1 : 0);
}

main();
