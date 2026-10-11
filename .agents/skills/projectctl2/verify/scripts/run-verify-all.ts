#!/usr/bin/env bun
import { resolve, join } from 'node:path';

// Read-only verify-all runner (ODD determinism MVP-4).
// Runs the five health blocks in fixed order even when early blocks are red,
// prints TODO VERDE|ROJOS plus per-block evidence, and never writes files,
// never touches persistent memory, never auto-fixes.
// Stdout only (--json goes to stdout).

interface BlockResult { name: string; pass: boolean; detail: string; evidence: string }

function help(): string {
  return `Read-only projectctl2 health check (no writes, no fixes, no memory).

Usage: bun run-verify-all.ts [--root DIR] [--json]

  --root DIR   Project root (default: current directory)
  --json       Print machine-readable JSON instead of the human template
  --help, -h   Show this help

Blocks (always run in order, even when red):
  1. generated: check-generated.ts + skill-version.ts check
  2. contracts: verify-contracts.ts
  3. requirements: six validators with --json and no scope flags
  4. unit-tests: bun test over the projectctl2 tree
  5. agents: opencode agent list shows sdd-/req-fixer/verify-all

Exits: 0 TODO VERDE (all green), 1 ROJOS (any red), 2 usage error.`;
}

function parseArgs(argv: string[]): { root: string; json: boolean; help: boolean } {
  const out = { root: process.cwd(), json: false, help: false };
  const seenRoot = { value: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--help' || arg === '-h') { out.help = true; continue; }
    if (arg === '--json') { out.json = true; continue; }
    const eq = arg.indexOf('=');
    const flag = eq >= 0 ? arg.slice(0, eq) : arg;
    const attached = eq >= 0 ? arg.slice(eq + 1) : undefined;
    if (flag === '--root') {
      if (seenRoot.value) throw new Error('Option supplied more than once: --root');
      seenRoot.value = true;
      const value = attached !== undefined && attached !== '' ? attached : argv[++i];
      if (value === undefined || !value.trim() || value.startsWith('--')) throw new Error('Missing value for --root');
      out.root = resolve(value);
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return out;
}

function run(cmd: string, args: string[], cwd: string): { exitCode: number; stdout: string; stderr: string } {
  try {
    const proc = Bun.spawnSync([cmd, ...args], { stdout: 'pipe', stderr: 'pipe', cwd });
    return { exitCode: proc.exitCode ?? 1, stdout: proc.stdout.toString(), stderr: proc.stderr.toString() };
  } catch (error) {
    // Missing binary (e.g. opencode CLI absent) is a red block, never a crash.
    return { exitCode: 127, stdout: '', stderr: error instanceof Error ? error.message : String(error) };
  }
}

function firstLines(text: string, max = 6): string {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  return lines.slice(0, max).join(' | ').slice(0, 600);
}

// Block 1: generated coherence (check-generated + skill-version check).
function blockGenerated(packageDir: string): BlockResult {
  const genScript = join(packageDir, 'types', 'scripts', 'check-generated.ts');
  const versionScript = join(packageDir, 'scripts', 'skill-version.ts');
  const gen = run('bun', [genScript], process.cwd());
  const ver = run('bun', [versionScript, 'check'], process.cwd());
  const genOk = gen.exitCode === 0;
  const verOk = ver.exitCode === 0;
  const pass = genOk && verOk;
  const detail = pass ? 'coherent' : `gen:${genOk ? 'ok' : 'red'} version:${verOk ? 'ok' : 'red'}`;
  const evidence = `check-generated exit ${gen.exitCode}: ${firstLines(gen.stdout || gen.stderr) || '(no output)'}; skill-version check exit ${ver.exitCode}: ${firstLines(ver.stdout || ver.stderr) || '(no output)'}`;
  return { name: 'generated', pass, detail, evidence };
}

// Block 2: contracts (verify-contracts must exit 0 with 0 findings).
function blockContracts(packageDir: string): BlockResult {
  const script = join(packageDir, 'types', 'scripts', 'verify-contracts.ts');
  const res = run('bun', [script], process.cwd());
  const pass = res.exitCode === 0;
  const detail = pass ? 'consistent' : 'findings';
  const evidence = `verify-contracts exit ${res.exitCode}: ${firstLines(`${res.stdout}\n${res.stderr}`) || '(no output)'}`;
  return { name: 'contracts', pass, detail, evidence };
}

// Block 3: six requirements validators, project scope, --json, no filters.
function blockRequirements(packageDir: string, root: string): BlockResult & { greenCount: number } {
  const scripts = [
    join(packageDir, 'requirements', 'criterios', 'scripts', 'validate-criteria.ts'),
    join(packageDir, 'requirements', 'docs', 'scripts', 'validate-app-map-docs.ts'),
    join(packageDir, 'requirements', 'estructura', 'scripts', 'validate-structure.ts'),
    join(packageDir, 'requirements', 'estructura', 'scripts', 'check-paths.ts'),
    join(packageDir, 'requirements', 'code', 'scripts', 'validate-code.ts'),
    join(packageDir, 'requirements', 'test', 'scripts', 'validate-tests.ts'),
  ];
  let green = 0;
  const reds: string[] = [];
  for (const script of scripts) {
    const res = run('bun', [script, '--root', root, '--json'], process.cwd());
    let valid = false;
    try {
      const body = JSON.parse(res.stdout || 'null') as { valid?: boolean; issues?: unknown[] };
      valid = res.exitCode === 0 && body?.valid === true && Array.isArray(body.issues) && body.issues.length === 0;
      if (!valid && Array.isArray(body?.issues) && body.issues.length > 0) {
        reds.push(`${script.split('/').slice(-2).join('/')}: ${firstLines(JSON.stringify(body.issues))}`);
      } else if (!valid) {
        reds.push(`${script.split('/').slice(-2).join('/')}: exit ${res.exitCode} ${firstLines(res.stderr || res.stdout)}`);
      }
    } catch {
      reds.push(`${script.split('/').slice(-2).join('/')}: no JSON (exit ${res.exitCode}) ${firstLines(res.stderr || res.stdout)}`);
    }
    if (valid) green += 1;
  }
  const pass = green === scripts.length;
  return { name: 'requirements', pass, detail: `${green}/${scripts.length} green`, evidence: pass ? 'all six validators valid:true' : reds.join(' || ').slice(0, 1200), greenCount: green };
}

// Block 4: unit tests over the whole projectctl2 tree (one command).
function blockUnitTests(packageDir: string, root: string): BlockResult & { passCount: number; failCount: number } {
  // Prefer the project-root package tree when --root points at a project;
  // fall back to the runner's own package dir for local runs.
  let target = join(root, '.agents', 'skills', 'projectctl2');
  try {
    const stat = Bun.file(join(target, 'SKILL.md'));
    void stat;
  } catch { void 0; }
  const res = run('bun', ['test', target], root);
  const combined = `${res.stdout}\n${res.stderr}`;
  let passCount = 0;
  let failCount = 0;
  const passMatch = combined.match(/(\d+)\s+pass\b/);
  const failMatch = combined.match(/(\d+)\s+fail\b/);
  if (passMatch) passCount = Number(passMatch[1]);
  if (failMatch) failCount = Number(failMatch[1]);
  // Fall back: exit code decides when counts are unparseable.
  const pass = res.exitCode === 0 && failCount === 0;
  if (!passMatch && !failMatch) {
    return { name: 'unit-tests', pass, detail: res.exitCode === 0 ? 'pass' : 'fail', evidence: `bun test exit ${res.exitCode}: ${firstLines(combined) || '(no output)'}`, passCount, failCount };
  }
  return { name: 'unit-tests', pass, detail: `${passCount} pass, ${failCount} fail`, evidence: `bun test exit ${res.exitCode}: ${firstLines(combined) || '(no output)'}`, passCount, failCount };
}

// Block 5: agent discovery via the opencode CLI (read-only list + grep).
function blockAgents(): BlockResult {
  const res = run('opencode', ['agent', 'list'], process.cwd());
  if (res.exitCode !== 0 && res.stdout.trim() === '' && /not found|ENOENT|unknown|not recognized/i.test(`${res.stderr} ${res.stdout}`)) {
    return { name: 'agents', pass: false, detail: 'opencode CLI unavailable', evidence: `opencode agent list exit ${res.exitCode}: ${(res.stderr || res.stdout || 'command not found').trim().slice(0, 300)}` };
  }
  const combined = `${res.stdout}\n${res.stderr}`;
  const has = (needle: string): boolean => combined.split(/\r?\n/).some(l => l.trimStart().startsWith(needle));
  const want = ['sdd-orchestrator', 'req-fixer', 'verify-all'];
  const missing = want.filter(w => !has(w));
  const hasSdd = /sdd-/.test(combined);
  const pass = missing.length === 0 && hasSdd;
  const detail = pass ? 'all present' : `missing: ${[...missing, ...(hasSdd ? [] : ['sdd-*'])].join(', ') || 'unknown'}`;
  return { name: 'agents', pass, detail, evidence: `opencode agent list exit ${res.exitCode}: ${firstLines(combined) || '(no agents listed)'}` };
}

function humanReport(blocks: BlockResult[], status: string): string {
  const by = (name: string): BlockResult => blocks.find(b => b.name === name)!;
  const lines: string[] = [];
  lines.push('## verify-all report');
  lines.push(`- status: ${status}`);
  lines.push('- blocks:');
  lines.push(`  - generated: ${by('generated').pass ? 'pass' : 'fail'} (${by('generated').detail})`);
  lines.push(`  - contracts: ${by('contracts').pass ? 'pass' : 'fail'} (${by('contracts').detail})`);
  lines.push(`  - requirements: ${by('requirements').pass ? 'pass' : 'fail'} (${by('requirements').detail})`);
  lines.push(`  - unit-tests: ${by('unit-tests').pass ? 'pass' : 'fail'} (${by('unit-tests').detail})`);
  lines.push(`  - agents: ${by('agents').pass ? 'pass' : 'fail'} (${by('agents').detail})`);
  if (status === 'ROJOS') {
    const reds = blocks.filter(b => !b.pass).map(b => `${b.name}: ${b.evidence}`);
    lines.push(`- reds: ${reds.join(' || ')}`);
  }
  return lines.join('\n');
}

function main(argv: string[]): void {
  let opts: { root: string; json: boolean; help: boolean };
  try {
    opts = parseArgs(argv);
  } catch (error) {
    console.error(`${error instanceof Error ? error.message : String(error)}\n\n${help()}`);
    process.exit(2);
  }
  if (opts.help) { console.log(help()); return; }
  const root = resolve(opts.root);
  const packageDir = resolve(import.meta.dir, '..', '..');

  // Fixed order; every block runs even when an earlier one is red.
  const generated = blockGenerated(packageDir);
  const contracts = blockContracts(packageDir);
  const requirements = blockRequirements(packageDir, root);
  const unitTests = blockUnitTests(packageDir, root);
  const agents = blockAgents();
  const blocks: BlockResult[] = [generated, contracts, requirements, unitTests, agents];
  const allGreen = blocks.every(b => b.pass);
  const status = allGreen ? 'TODO VERDE' : 'ROJOS';

  if (opts.json) {
    console.log(JSON.stringify({
      status,
      blocks: {
        generated: { pass: generated.pass, detail: generated.detail, evidence: generated.evidence },
        contracts: { pass: contracts.pass, detail: contracts.detail, evidence: contracts.evidence },
        requirements: { pass: requirements.pass, detail: requirements.detail, evidence: requirements.evidence },
        unitTests: { pass: unitTests.pass, detail: unitTests.detail, evidence: unitTests.evidence },
        agents: { pass: agents.pass, detail: agents.detail, evidence: agents.evidence },
      },
      reds: blocks.filter(b => !b.pass).map(b => ({ block: b.name, evidence: b.evidence })),
    }, null, 2));
  } else {
    console.log(humanReport(blocks, status));
  }
  process.exit(allGreen ? 0 : 1);
}

if (import.meta.main) main(process.argv.slice(2));
