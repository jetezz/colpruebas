#!/usr/bin/env bun
import { resolve } from 'node:path';
import { loadStructure } from './structure-contract.ts';

function main() {
  const argv = process.argv.slice(2);
  let root = process.cwd();
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') {
      console.log('Validate required structure maps against criteria navigation.\n\nUsage: bun validate-structure.ts [--root DIR] [--json]');
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

  const criteriaScript = resolve(import.meta.dir, '../../criterios/scripts/validate-criteria.ts');
  const proc = Bun.spawnSync(['bun', criteriaScript, '--root', root, '--json'], { stdout: 'pipe', stderr: 'pipe' });
  if (proc.exitCode !== 0) {
    const message = (proc.stderr.toString() || proc.stdout.toString() || 'criteria validation failed').trim();
    const issues = [{ path: 'criteria prerequisite', message }];
    if (json) console.log(JSON.stringify({ valid: false, issues }, null, 2));
    else console.error(`Cannot validate structure until criteria pass: ${message}`);
    process.exit(1);
  }

  const result = loadStructure(root);
  if (json) console.log(JSON.stringify({ valid: result.issues.length === 0, issues: result.issues }, null, 2));
  else if (!result.issues.length) console.log('Required directories and type maps match navigation.yaml.');
  else {
    console.error(`Found ${result.issues.length} issue(s):`);
    for (const issue of result.issues) console.error(`- ${issue.path}: ${issue.message}`);
  }
  process.exit(result.issues.length ? 1 : 0);
}

main();
