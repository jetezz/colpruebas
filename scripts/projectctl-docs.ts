#!/usr/bin/env bun
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dir, '..');
const NAVIGATION = 'docs/app-map/navigation.yaml';
const REQUIRED_SECTIONS = [
  { label: 'URL', headings: ['URL'] },
  { label: 'Tab', headings: ['Tab'] },
  { label: 'Objetivo', headings: ['Objetivo'] },
  { label: 'Criterios', headings: ['Criterios', 'Criterios de calidad'] },
  { label: 'Diagrama Mermaid', headings: ['Diagrama Mermaid'] },
  { label: 'Sources', headings: ['Sources'] },
] as const;

type Bundle = { path: string; content: string };

function navigationBundles(repoRoot: string): string[] {
  const path = join(repoRoot, NAVIGATION);
  if (!existsSync(path)) return [];
  return [...readFileSync(path, 'utf8').matchAll(/\s+bundle:\s*([^\s#]+)\s*$/gm)]
    .map((match) => match[1]?.replace(/^['"]|['"]$/g, ''))
    .filter((value): value is string => Boolean(value));
}

function loadBundles(repoRoot: string): Bundle[] {
  return navigationBundles(repoRoot).map((bundle) => ({
    path: `docs/app-map/${bundle}.md`,
    content: existsSync(join(repoRoot, 'docs/app-map', `${bundle}.md`))
      ? readFileSync(join(repoRoot, 'docs/app-map', `${bundle}.md`), 'utf8')
      : '',
  }));
}

function checkBundle(bundle: Bundle): string[] {
  const errors: string[] = [];
  if (!bundle.content) return [`${bundle.path}: bundle is missing or empty`];
  if (!bundle.content.startsWith('---\n')) errors.push(`${bundle.path}: frontmatter is missing`);
  for (const section of REQUIRED_SECTIONS) {
    const hasSection = section.headings.some((heading) =>
      new RegExp(`^##\\s+\\d+\\.\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(bundle.content),
    );
    if (!hasSection) errors.push(`${bundle.path}: missing section "${section.label}"`);
  }
  const criteria = [...bundle.content.matchAll(/^\s*- id:\s*([A-Za-z0-9-]+)\s*$/gm)].map((match) => match[1]);
  if (criteria.length === 0) errors.push(`${bundle.path}: criteria[] is empty or missing`);
  for (const id of criteria) if (!/^[A-Z][A-Z0-9]*-\d+[A-Z0-9-]*$/.test(id)) errors.push(`${bundle.path}: invalid criterion id ${id}`);
  return errors;
}

export function inspectDocs(repoRoot = REPO_ROOT): { bundles: string[]; errors: string[] } {
  const errors: string[] = [];
  if (!existsSync(join(repoRoot, NAVIGATION))) errors.push(`${NAVIGATION}: file is missing`);
  const bundles = loadBundles(repoRoot);
  for (const bundle of bundles) errors.push(...checkBundle(bundle));
  return { bundles: bundles.map((bundle) => bundle.path), errors };
}

function main(argv = process.argv.slice(2)): number {
  const command = argv[0] ?? 'status';
  if (!['lint', 'check', 'status', 'generate'].includes(command)) {
    console.error('Usage: bun scripts/projectctl-docs.ts <lint|check|status|generate>');
    return 2;
  }
  const report = inspectDocs();
  console.log(`projectctl docs ${command}: ${report.bundles.length} home bundle(s)`);
  if (command === 'generate') console.log('home-only mode: no docs/app-map bundle is rewritten by this generator');
  for (const error of report.errors) console.error(`❌ ${error}`);
  if (report.errors.length > 0) return 1;
  console.log('✅ projectctl docs check passed');
  return 0;
}

if (import.meta.main) process.exitCode = main();
