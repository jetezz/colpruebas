/** Read-only operative reference inventory; definitions still belong to App Map. */
import { lstatSync, existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { collectCriterionIds } from './criterion-contract.ts';

export function criterionReferences(root: string, roots: string[], ids: string[]): Array<{ id: string; path: string; line: number }> {
  root = realpathSync(resolve(root));
  const selected = new Set(ids), files = new Set<string>();
  const references: Array<{ id: string; path: string; line: number }> = [];
  if (!selected.size) return references;
  let budget = 20000;
  function visit(path: string): void {
    const full = resolve(root, path), rel = relative(root, full);
    if (!rel || isAbsolute(rel) || rel.split(/[\\/]/).includes('..')) throw new Error('criterion reference root escapes project');
    if (!existsSync(full)) return;
    if (--budget < 0) throw new Error('criterion reference inventory budget exceeded');
    const stat = lstatSync(full);
    if (stat.isSymbolicLink() || realpathSync(full) !== full) throw new Error(`criterion reference symlink: ${rel}`);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(full)) if (!['node_modules', '.git', '.runtime', 'dist'].includes(entry)) visit(`${rel}/${entry}`);
    } else if (stat.isFile() && /\.(?:[cm]?[jt]sx?|sql|py|go|rs|sh)$/.test(rel)) files.add(rel);
  }
  roots.forEach(visit);
  for (const path of [...files].sort()) {
    readFileSync(resolve(root, path), 'utf8').split(/\r?\n/).forEach((line, index) => {
      // Actual comment markers only; prose, string fixtures and legacy artifacts are not operative references.
      const marker = /^\s*(?:\/\/|--|<!--|#|\*)\s*@(ac|criterion|trace|contract)\b(.*)$/.exec(line);
      if (!marker) return;
      const value = marker[1] === 'trace' || marker[1] === 'contract' ? /\bac=([^\s,]+)/.exec(marker[2]!)?.[1] ?? '' : marker[2]!;
      for (const id of collectCriterionIds(value)) if (selected.has(id)) references.push({ id, path: path.replaceAll('\\', '/'), line: index + 1 });
    });
  }
  return references;
}
