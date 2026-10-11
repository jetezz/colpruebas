import { describe, expect, test } from 'bun:test';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(import.meta.dir, '../skill-version.ts');

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'projectctl2-version-'));
  mkdirSync(join(root, 'requirements'), { recursive: true });
  mkdirSync(join(root, 'sdd'), { recursive: true });
  writeFileSync(join(root, 'SKILL.md'), `---\nname: projectctl2\ndescription: test package\nmetadata:\n  id: projectctl2\n  version: 0.1.0\n---\n\n# projectctl2 test fixture\n`);
  writeFileSync(join(root, 'requirements', 'SKILL.md'), '# Requirement rule\n');
  writeFileSync(join(root, 'sdd', '.gitkeep'), '');
  return root;
}

function run(root: string, ...args: string[]) {
  return spawnSync('bun', [script, ...args, '--root', root], { encoding: 'utf8' });
}

describe('projectctl2 skill versioning', () => {
  test('initializes, detects edits, bumps patch, and validates the new SHA', () => {
    const root = fixture();
    try {
      expect(run(root, 'init').status).toBe(0);
      expect(run(root, 'check').status).toBe(0);

      writeFileSync(join(root, 'requirements', 'SKILL.md'), '# Updated criterion rule\n');
      const stale = run(root, 'check');
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain('Skill tree is dirty');

      const bump = run(root, 'bump', 'patch');
      expect(bump.status).toBe(0);
      expect(readFileSync(join(root, 'SKILL.md'), 'utf8')).toContain('version: 0.1.1');
      expect(run(root, 'check').status).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('bumps minor and major with SemVer component resets', () => {
    const root = fixture();
    try {
      expect(run(root, 'init').status).toBe(0);
      writeFileSync(join(root, 'requirements', 'SKILL.md'), '# Minor change\n');
      expect(run(root, 'bump', 'minor').status).toBe(0);
      expect(readFileSync(join(root, 'SKILL.md'), 'utf8')).toContain('version: 0.2.0');
      writeFileSync(join(root, 'sdd', '.gitkeep'), 'satellite added\n');
      expect(run(root, 'bump', 'major').status).toBe(0);
      expect(readFileSync(join(root, 'SKILL.md'), 'utf8')).toContain('version: 1.0.0');
      expect(run(root, 'check').status).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('does not rewrite the release manifest as part of its own tree digest', () => {
    const root = fixture();
    try {
      expect(run(root, 'init').status).toBe(0);
      const first = run(root, 'sha', '--json');
      const manifestFile = join(root, 'skill-release.json');
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8')) as { digest: string };
      manifest.digest = '0'.repeat(64);
      writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
      const second = run(root, 'sha', '--json');
      expect(first.status).toBe(0);
      expect(second.status).toBe(0);
      expect(JSON.parse(first.stdout).digest).toBe(JSON.parse(second.stdout).digest);
      expect(run(root, 'check').status).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('refuses an unnecessary bump when the tree is already sealed', () => {
    const root = fixture();
    try {
      expect(run(root, 'init').status).toBe(0);
      expect(run(root, 'bump', 'patch').status).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
