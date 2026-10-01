/** Shared, read-only project App Map index. Navigation owns hierarchy; bundle frontmatter owns criteria. */
import { existsSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { isCriterionId } from './criterion-contract.ts';

export type AppNode = { id: string; title: string; kind: 'view' | 'feature'; bundle: string; children: AppNode[]; view: string };
export type AppCriterion = { id: string; bundle: string; node?: AppNode; data: Record<string, unknown> };
export type BundleEntry = { file: string; criteria: AppCriterion[]; error?: string; listed: boolean };
export type AppMapInventory = {
  root: string;
  navigation: AppNode[];
  nodes: AppNode[];
  bundles: BundleEntry[];
  criteria: AppCriterion[];
  issues: string[];
};
export type AppScope = { kind: 'project' | 'view' | 'feature'; target?: string; nodes: AppNode[]; bundles: BundleEntry[]; criteria: AppCriterion[] };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function within(root: string, file: string): boolean {
  const rel = relative(root, file);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../');
}
function safeRead(root: string, file: string): string | null {
  try {
    const full = resolve(root, file);
    return within(root, full) && within(root, realpathSync(full)) ? readFileSync(full, 'utf8') : null;
  } catch { return null; }
}
function markdownFiles(root: string): string[] {
  const base = resolve(root, 'docs/app-map');
  const files: string[] = [];
  let budget = 5000;
  function visit(dir: string) {
    if (!within(base, dir) || !existsSync(dir) || --budget < 0) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const file = join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(relative(root, file).replaceAll('\\', '/'));
    }
  }
  try { visit(base); } catch { /* individual unreadable bundles are handled by doctors */ }
  return files.sort();
}

export function loadAppMap(root: string): AppMapInventory {
  root = resolve(root);
  const issues: string[] = [];
  const nodes: AppNode[] = [];
  const navigation: AppNode[] = [];
  const byBundle = new Map<string, AppNode>();
  const byId = new Set<string>();
  const source = safeRead(root, 'docs/app-map/navigation.yaml');
  if (source === null) issues.push('navigation-missing');
  else try {
    const manifest = Bun.YAML.parse(source);
    if (!record(manifest) || typeof manifest.root_id !== 'string' || !Array.isArray(manifest.navigation) || !manifest.navigation.length) throw new Error('navigation-invalid');
    function visit(raw: unknown, parent?: AppNode): AppNode {
      if (!record(raw) || typeof raw.id !== 'string' || !raw.id.trim() || typeof raw.title !== 'string' || !raw.title.trim() ||
          (raw.kind !== 'view' && raw.kind !== 'feature') || typeof raw.bundle !== 'string' || !/^[\w./-]+$/.test(raw.bundle) ||
          raw.bundle.split('/').includes('..') || raw.bundle.startsWith('/') || raw.bundle.endsWith('/') || /\.(?:md|mmd)$/.test(raw.bundle) || !Array.isArray(raw.children) ||
          (parent ? raw.kind !== 'feature' : raw.kind !== 'view')) throw new Error('navigation-invalid');
      if (byId.has(raw.id) || byBundle.has(raw.bundle)) throw new Error('navigation-duplicate');
      byId.add(raw.id);
      const node: AppNode = { id: raw.id, title: raw.title, kind: raw.kind, bundle: raw.bundle, children: [], view: parent?.view ?? raw.id };
      nodes.push(node);
      byBundle.set(node.bundle, node);
      node.children = raw.children.map(child => visit(child, node));
      return node;
    }
    navigation.push(...manifest.navigation.map(raw => visit(raw)));
    if (!byId.has(manifest.root_id)) issues.push('root-id-unknown');
  } catch (error) { issues.push(error instanceof Error && error.message === 'navigation-duplicate' ? 'navigation-duplicate' : 'navigation-invalid'); }
  const files = new Set(markdownFiles(root));
  for (const node of nodes) files.add(`docs/app-map/${node.bundle}.md`);
  const bundles: BundleEntry[] = [];
  const criteria: AppCriterion[] = [];
  for (const file of [...files].sort()) {
    const node = byBundle.get(file.replace(/^docs\/app-map\//, '').replace(/\.md$/, ''));
    const entry: BundleEntry = { file, listed: !!node, criteria: [] };
    const content = safeRead(root, file);
    if (content === null) entry.error = 'bundle-unreadable';
    else {
      const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!match) entry.error = 'bundle-frontmatter-missing';
      else try {
        const fm = Bun.YAML.parse(match[1]);
        if (!record(fm) || !Array.isArray(fm.criteria)) entry.error = 'criteria-missing';
        else for (const raw of fm.criteria) {
          if (!record(raw) || typeof raw.id !== 'string' || !isCriterionId(raw.id.toUpperCase())) { entry.error = 'criterion-id-invalid'; continue; }
          const criterion = { id: raw.id.toUpperCase(), bundle: file, node, data: raw };
          entry.criteria.push(criterion);
          if (node) criteria.push(criterion);
        }
      } catch { entry.error = 'bundle-frontmatter-invalid'; }
    }
    bundles.push(entry);
  }
  return { root, navigation, nodes, bundles, criteria, issues };
}

/** Strict authority reader for planning and references. Samples/unlisted bundles never define IDs. */
export function requireAppMap(root: string): AppMapInventory {
  const inventory = loadAppMap(root);
  const issues = [...inventory.issues, ...inventory.bundles.filter(b => b.listed && b.error).map(b => `${b.file}: ${b.error}`)];
  const seen = new Set<string>();
  for (const criterion of inventory.criteria) {
    if (seen.has(criterion.id)) issues.push(`duplicate criterion ID: ${criterion.id}`);
    seen.add(criterion.id);
  }
  if (issues.length) throw new Error(`App Map authority invalid: ${issues.join(', ')}`);
  return inventory;
}

/** Resolves against the navigation tree, never against a URL or a filename. */
export function selectAppScope(inventory: AppMapInventory, target?: string): AppScope {
  if (!target) return { kind: 'project', nodes: inventory.nodes, bundles: inventory.bundles, criteria: inventory.criteria };
  if (inventory.issues.length) throw new Error(`Cannot resolve target: ${inventory.issues.join(', ')}`);
  const parts = target.split(':');
  if (parts.length > 2 || parts.some(part => !part)) throw new Error(`Invalid target: ${target}`);
  const view = inventory.navigation.find(node => node.id === parts[0]);
  if (!view) throw new Error(`Unknown view: ${parts[0]}`);
  let owner = view;
  if (parts[1]) {
    const matches = inventory.nodes.filter(node => node.kind === 'feature' && node.view === view.id && node.id === parts[1]);
    if (matches.length !== 1) throw new Error(`${matches.length ? 'Ambiguous' : 'Unknown'} feature: ${target}`);
    owner = matches[0];
  }
  const selected: AppNode[] = [];
  function visit(node: AppNode) { selected.push(node); node.children.forEach(visit); }
  visit(owner);
  const selectedBundles = new Set(selected.map(node => `docs/app-map/${node.bundle}.md`));
  return { kind: parts[1] ? 'feature' : 'view', target, nodes: selected,
    bundles: inventory.bundles.filter(entry => selectedBundles.has(entry.file)),
    criteria: inventory.criteria.filter(item => selectedBundles.has(item.bundle)) };
}

export function targetArg(args: string[]): string | undefined {
  const targets = args.filter(arg => arg.startsWith('--target='));
  if (targets.length > 1 || targets.some(arg => arg === '--target=')) throw new Error('Pass one nonempty --target=<view>[:<feature>].');
  return targets[0]?.slice('--target='.length);
}
