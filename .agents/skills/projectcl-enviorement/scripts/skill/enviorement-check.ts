#!/usr/bin/env bun
/** Portable package check for the projectcl-enviorement satellite (skill/project pattern). */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const skillRoot = resolve(import.meta.dir, '../..');

const REQUIRED_FILES = [
  'SKILL.md',
  'references/managed-environments.md',
  'references/sources.md',
  'scripts/project/doctor-environment.mjs',
];

const FRONTMATTER_KEYS = ['id', 'version', 'layer', 'type', 'sot', 'install', 'license'];

function frontmatterBlock(source: string): string {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

export function checkEnviorement(skillDir: string = skillRoot): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  for (const rel of REQUIRED_FILES) {
    if (!existsSync(resolve(skillDir, rel))) failures.push(`missing file: ${rel}`);
  }
  const skillPath = resolve(skillDir, 'SKILL.md');
  if (existsSync(skillPath)) {
    const source = readFileSync(skillPath, 'utf8');
    const frontmatter = frontmatterBlock(source);
    if (!frontmatter) {
      failures.push('SKILL.md frontmatter missing');
    } else {
      for (const key of FRONTMATTER_KEYS) {
        const pattern = key === 'sot'
          ? /^\s*(?:sot|sot_policy)\s*:/m
          : new RegExp(`^\\s*${key}\\s*:`, 'm');
        if (!pattern.test(frontmatter)) failures.push(`SKILL.md frontmatter missing key: ${key}`);
      }
    }
  }
  const selfPath = resolve(skillDir, 'scripts/skill/enviorement-check.ts');
  if (existsSync(selfPath)) {
    const selfSource = readFileSync(selfPath, 'utf8');
    const badImport = selfSource
      .split(/\r?\n/)
      .some((line) => /^\s*(import|export)[^'"]*['"]/.test(line) && /sandbox\/|sandbox-runtime|frontend\//.test(line));
    if (badImport) failures.push('enviorement-check.ts must not import sandbox/ or frontend/ modules');
  } else {
    failures.push('missing file: scripts/skill/enviorement-check.ts');
  }
  return { ok: failures.length === 0, failures };
}

if (import.meta.main) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('Usage: bun .agents/skills/projectcl-enviorement/scripts/skill/enviorement-check.ts --check');
    process.exit(0);
  }
  const result = checkEnviorement();
  for (const failure of result.failures) console.error(`[enviorement-check] FAIL ${failure}`);
  if (result.ok) console.log('[enviorement-check] ok');
  process.exit(result.ok ? 0 : 1);
}
