/**
 * Read-only app-map doctor. Local checks locate mistakes; --managed delegates
 * the final verdict to the authenticated reader's strict parser via projectctl.
 */
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, join, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadAppMap, selectAppScope, targetArg } from './app-map-inventory.ts';

type Finding = { code: string; path: string; message: string };
type State = 'missing' | 'invalid' | 'unverified' | 'valid';
const args = process.argv.slice(2);
const json = args.includes('--json');
const managed = args.includes('--managed');
let target: string | undefined;
try { target = targetArg(args); } catch (error) { console.error(String(error)); process.exit(2); }
let root = '.';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--root' && args[i + 1]) root = args[++i];
  else if (!['--json', '--managed'].includes(args[i]) && !args[i].startsWith('--target=')) {
    console.error('Usage: bun .agents/skills/projectctl-requirements/scripts/project/doctor-docs.ts [--root PROJECT] [--target=<view>[:<feature>]] [--managed] [--json]');
    process.exit(2);
  }
}
root = resolve(root);
const inventory = loadAppMap(root);
let scope;
try { scope = selectAppScope(inventory, target); } catch (error) { console.error(String(error)); process.exit(2); }
const selected = new Set(scope!.nodes.map(node => node.bundle));
const appMap = resolve(root, 'docs/app-map');
const failures: Finding[] = [];
const policies: Finding[] = [];
let nodesChecked = 0;
let state: State = 'unverified';
const add = (code: string, path: string, message: string) => failures.push({ code, path, message });
const policy = (code: string, path: string, message: string) => policies.push({ code, path, message });
function inside(file: string): boolean {
  const path = relative(appMap, file);
  return !isAbsolute(path) && path !== '..' && !path.startsWith('../');
}
function readBundle(bundle: string, extension: '.md' | '.mmd'): string | null {
  const file = resolve(appMap, bundle + extension);
  if (!inside(file) || !existsSync(file) || !inside(realpathSync(file))) return null;
  try { return readFileSync(file, 'utf8'); } catch { return null; }
}
function mapping(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0; }
const kinds = new Set(['view', 'feature']);
const types = new Set(['ui', 'functionality', 'a11y', 'backend', 'data', 'integration', 'security', 'performance', 'tooling']);
const functional = new Set(['implemented', 'partial', 'missing', 'not-applicable']);
const coverage = new Set(['covered', 'partial', 'missing', 'not-applicable']);
const methods = ['Unit', 'PW-CLI', 'PW-AUTO', 'Manual'];
function frontmatter(md: string, path: string): Record<string, unknown> | null {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) { add('frontmatter', path, 'Add YAML frontmatter with id, title, kind, summary and source_of_truth.'); return null; }
  try {
    const value = Bun.YAML.parse(match[1]);
    if (!mapping(value)) throw new Error('frontmatter must be a mapping');
    // Bun.YAML accepts indentation that the reader rejects. Never certify
    // the exact parser locally: --managed uses the same reader as the Doc tab.
    return value;
  } catch {
    add('frontmatter', path, 'Frontmatter is malformed.');
    return null;
  }
}
function canonicalUrl(md: string): boolean {
  const section = md.match(/^##\s+1\.\s+URL\s*$([\s\S]*?)(?=^##\s+\d+\.\s+|(?![\s\S]))/m);
  const candidate = section?.[1]?.trim().match(/(?:`([^`]+)`|(\/[^\s`]*)(?=\s|$)|(https?:\/\/[^\s`]+))/i)?.slice(1).find(Boolean);
  if (!candidate) return false;
  if (candidate.startsWith('/')) return !/[\s<>]/.test(candidate);
  try { return ['http:', 'https:'].includes(new URL(candidate).protocol); } catch { return false; }
}
function checkCriteria(raw: unknown, path: string) {
  if (!Array.isArray(raw)) { policy('criteria', path, 'Declare criteria[] inline in frontmatter for projectctl traceability.'); return; }
  for (const [index, item] of raw.entries()) {
    const location = `${path}:criteria[${index}]`;
    if (!mapping(item) || !text(item.id) || !text(item.title) || !types.has(item.type as string)) {
      add('criteria-shape', location, 'Each criterion needs id, title and a supported type.'); continue;
    }
    if (!functional.has(item.functional as string)) policy('functional', location, 'Declare a canonical functional state.');
    if (!mapping(item.coverage) || methods.some(method => !coverage.has((item.coverage as Record<string, unknown>)[method] as string))) {
      policy('coverage', location, 'Declare Unit, PW-CLI, PW-AUTO and Manual with supported states.');
    }
  }
}
function checkSections(md: string, path: string) {
  const sections = ['URL', 'Tab', 'Objetivo', 'Criterios', 'Diagrama Mermaid', 'Sources'];
  for (const [index, label] of sections.entries()) {
    if (!new RegExp(`^##\\s+${index + 1}\\.\\s+${label}\\s*$`, 'm').test(md)) policy('section', path, `Add the editorial section ${index + 1}. ${label}.`);
  }
}

if (!existsSync(appMap) || !existsSync(join(appMap, 'navigation.yaml'))) {
  state = 'missing';
  add('navigation-missing', 'docs/app-map/navigation.yaml', 'Create the manifest: root_id and a nonempty navigation array; bundles alone are not rendered.');
} else {
  let manifest: Record<string, unknown> | null = null;
  try {
    const source = readFileSync(join(appMap, 'navigation.yaml'), 'utf8');
    const parsed = Bun.YAML.parse(source);
    if (!mapping(parsed)) throw new Error('manifest is not a mapping');
    manifest = parsed;
  } catch { add('navigation-invalid', 'docs/app-map/navigation.yaml', 'Manifest must be valid YAML or JSON mapping.'); }
  if (manifest) {
    if (!text(manifest.root_id)) add('root-id', 'docs/app-map/navigation.yaml', 'root_id is required.');
    if (!Array.isArray(manifest.navigation) || !manifest.navigation.length) add('navigation-empty', 'docs/app-map/navigation.yaml', 'navigation must be a nonempty array.');
    const ids = new Set<string>();
    const bundles = new Set<string>();
    function walk(raw: unknown, location: string) {
      if (!mapping(raw)) { add('node', location, 'Node must be a mapping.'); return; }
      const { id, title, kind, bundle, children } = raw;
      if (!text(id) || !text(title) || !kinds.has(kind as string) || !text(bundle) || !Array.isArray(children)) {
        add('node-shape', location, 'Node requires id, title, kind (view|feature), relative bundle and children array.'); return;
      }
      if (!/^[\w./-]+$/.test(bundle) || bundle.includes('..') || bundle.startsWith('/') || bundle.endsWith('/') || /\.(?:md|mmd)$/.test(bundle)) {
        add('bundle-path', location, 'bundle must be a safe relative path without extension.'); return;
      }
      if (ids.has(id)) add('duplicate-id', location, 'Node id must be unique across navigation.');
      if (bundles.has(bundle)) add('duplicate-bundle', location, 'Bundle path must be unique across navigation.');
      ids.add(id); bundles.add(bundle); nodesChecked++;
      if (target && !selected.has(bundle)) { children.forEach((child, index) => walk(child, `${location}.children[${index}]`)); return; }
      const mdPath = `docs/app-map/${bundle}.md`;
      const mmdPath = `docs/app-map/${bundle}.mmd`;
      const md = readBundle(bundle, '.md');
      const mmd = readBundle(bundle, '.mmd');
      if (md === null) add('markdown-missing', mdPath, 'Create the Markdown sibling referenced by navigation.');
      if (mmd === null) add('mermaid-missing', mmdPath, 'Create the Mermaid sibling referenced by navigation.');
      if (md !== null) {
        const fm = frontmatter(md, mdPath);
        if (fm) {
          for (const key of ['id', 'title', 'kind'] as const) if (fm[key] !== raw[key]) add('frontmatter-identity', mdPath, `Frontmatter ${key} must match navigation.`);
          if (!text(fm.summary)) add('summary', mdPath, 'Frontmatter summary is required.');
          if (fm.source_of_truth !== 'app-map') add('source-of-truth', mdPath, 'source_of_truth must equal app-map.');
          checkCriteria(fm.criteria, mdPath);
        }
        if (!canonicalUrl(md)) add('canonical-url', mdPath, 'Declare a valid URL in ## 1. URL; workspace URL is not a fallback.');
        checkSections(md, mdPath);
      }
      if (mmd !== null && !/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph|C4Context|C4Container|C4Component|C4Dynamic|C4Deployment|requirementDiagram|kanban|quadrantChart|xychart-beta|block-beta|packet-beta|radar-beta)\b/.test(mmd.trim().split(/\r?\n/).map(line => line.trim()).find(line => line && !line.startsWith('%%')) ?? '')) add('mermaid-header', mmdPath, 'Mermaid must start with a supported diagram declaration.');
      children.forEach((child, index) => walk(child, `${location}.children[${index}]`));
    }
    if (Array.isArray(manifest.navigation)) manifest.navigation.forEach((node, index) => walk(node, `navigation[${index}]`));
    if (text(manifest.root_id) && !ids.has(manifest.root_id)) add('root-id-unknown', 'docs/app-map/navigation.yaml', 'root_id must match a navigation node.');
    if (target) for (const issue of inventory.issues) add(issue, 'docs/app-map/navigation.yaml', 'Navigation must be globally consistent before selecting a target.');
    const counts = new Map<string, number>();
    for (const criterion of inventory.criteria) counts.set(criterion.id, (counts.get(criterion.id) ?? 0) + 1);
    for (const id of new Set(scope!.criteria.map(item => item.id))) if ((counts.get(id) ?? 0) > 1) {
      add('duplicate-criterion', scope!.criteria.find(item => item.id === id)!.bundle, `${id} must have one owning bundle in the project.`);
    }
  }
  state = failures.length ? 'invalid' : 'unverified';
}

let managedResult: { state: State; errors: string[]; checkedMarkdown: number } | null = null;
if (managed) {
  // No shell, no credential forwarding into output; projectctl owns authentication.
  const result = spawnSync('projectctl', ['docs', 'lint', '--json'], { cwd: root, encoding: 'utf8', timeout: 30000, shell: false });
  try {
    const data = JSON.parse(result.stdout);
    if (data.state !== 'valid' && data.state !== 'invalid') throw new Error('invalid response');
    managedResult = { state: data.state, errors: Array.isArray(data.errors) ? data.errors.filter(text) : [], checkedMarkdown: data.checkedMarkdown };
    // The managed check is authoritative; it may synchronize stale workspace docs.
    if (!target) state = data.state;
  } catch {
    if (state === 'unverified') policy('managed-unavailable', 'projectctl docs lint', 'Authenticated runtime lint was unavailable; local success cannot prove renderability.');
  }
}
const report = { schemaVersion: 1, state, root, ...(target ? { scope: { kind: scope!.kind, target, nodes: scope!.nodes.length, criteria: scope!.criteria.length } } : {}), nodesChecked, findings: failures, policyFindings: policies, managed: managedResult, limitations: ['Local YAML parsing is advisory; only --managed uses the actual sandbox reader and may synchronize stale docs.', ...(target ? ['Managed verdict covers the whole project and does not certify the selected target.'] : [])] };
if (json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`Doc: ${state} (${nodesChecked} nodes)`);
  for (const entry of [...failures, ...policies]) console.log(`${entry.code}: ${entry.path} — ${entry.message}`);
}
process.exitCode = state === 'valid' ? 0 : state === 'unverified' ? 3 : 1;
