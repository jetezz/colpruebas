#!/usr/bin/env node
// Read-only, dependency-free structural doctor. This is not a Compose/YAML interpreter.
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';

const options = { root: '.', env: 'all', json: false };
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--json') options.json = true;
  else if (arg === '--root' && process.argv[i + 1]) options.root = process.argv[++i];
  else if (arg === '--env' && ['dev', 'prod', 'all'].includes(process.argv[i + 1])) options.env = process.argv[++i];
  else {
    console.error('Usage: node doctor-environment.mjs [--root PROJECT] [--env dev|prod|all] [--json]');
    process.exit(2);
  }
}

const root = resolve(options.root);
const plans = {
  prod: [['compose/compose.yml', 'compose/compose.prod.yml'], ['compose.yml', 'compose.prod.yml'], ['docker-compose.yml']],
  dev: [['compose/compose.yml', 'compose/compose.dev.yml'], ['compose.yml', 'compose.dev.yml'], ['docker-compose.dev.yml']],
};
const results = [];
function check(env, id, status, message, remediation = '') {
  results.push({ env, id, status, message, ...(remediation ? { remediation } : {}) });
}
function pathWithinRoot(file) {
  const rel = relative(root, file);
  return rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel);
}
function safeFile(path) {
  const absolute = resolve(root, path);
  if (!pathWithinRoot(absolute) || !existsSync(absolute) || !pathWithinRoot(realpathSync(absolute))) return null;
  try { return readFileSync(absolute, 'utf8'); } catch { return null; }
}
function envKeys(source) {
  const keys = new Map();
  if (!source) return keys;
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) keys.set(match[1], match[2].replace(/\s+#.*$/, '').trim().replace(/^(['"])(.*)\1$/, '$2'));
  }
  return keys;
}
// The supported subset is intentionally narrow: simple Compose mappings and lists.
// A construct outside it must be surfaced as unverified, not accepted as valid YAML.
function parse(source) {
  if (/(^|\n)\s*(?:include:|extends:|<<:|x-[\w-]+:)|[\s:]![a-z]+\b|(^|\s)[&*][A-Za-z][\w-]*/m.test(source)) return null;
  const lines = source.split(/\r?\n/).map(raw => ({ raw: raw.replace(/\s+#.*$/, ''), indent: raw.match(/^ */)[0].length }));
  if (lines.some(({ raw }) => /^\t/.test(raw))) return null;
  function block(start, end, indent, key) {
    const index = lines.findIndex((entry, i) => i >= start && i < end && entry.indent === indent && entry.raw.trim() === `${key}:`);
    if (index < 0) return null;
    let stop = index + 1;
    while (stop < end && (!lines[stop].raw.trim() || lines[stop].indent > indent)) stop++;
    return [index + 1, stop];
  }
  function named(range, indent) {
    if (!range) return [];
    return lines.slice(...range).filter(e => e.indent === indent && /^\s*[a-zA-Z][\w.-]*:\s*$/.test(e.raw)).map(e => e.raw.trim().slice(0, -1));
  }
  function text(range) { return range ? lines.slice(...range).map(e => e.raw).join('\n') : ''; }
  const services = block(0, lines.length, 0, 'services');
  const networks = block(0, lines.length, 0, 'networks');
  if (!services) return null;
  return {
    serviceNames: named(services, 2),
    service(name) { return text(block(...services, 2, name)); },
    networks: named(networks, 2),
    network(name) { return text(block(...networks, 2, name)); },
  };
}
function scalar(body, key) {
  const match = body.match(new RegExp(`^\\s*${key}:\\s*([^\\n]+)$`, 'm'));
  return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
}
function listValues(body, key) {
  const lines = body.split('\n');
  const index = lines.findIndex(l => new RegExp(`^\\s*${key}:\\s*$`).test(l));
  if (index < 0) return [];
  const indent = lines[index].match(/^ */)[0].length;
  const values = [];
  for (let i = index + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    if (lines[i].match(/^ */)[0].length <= indent) break;
    const match = lines[i].match(/^\s*-\s+(.+)$/);
    if (match) values.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return values;
}
function frontend(services, env) {
  const preferred = env === 'prod' ? ['frontend-prod', 'frontend', 'web'] : ['frontend-dev', 'frontend', 'web'];
  return preferred.find(name => services.has(name)) ?? null;
}
function networkAlias(body) {
  const match = body.match(/^\s*aliases:\s*\n((?:\s+-[^\n]+\n?)*)/m);
  return match ? [...match[1].matchAll(/^\s*-\s*(.+)$/gm)].map(v => v[1].replace(/^['"]|['"]$/g, '')) : [];
}
function interpolate(value, keys) {
  let unknown = false;
  const actual = value.replace(/\$\{([A-Za-z_][\w]*)(?::-([^}]*))?\}/g, (_, key, fallback) => {
    const resolved = keys.get(key) || fallback;
    if (!resolved) unknown = true;
    return resolved || '';
  });
  return unknown || !actual || actual.includes('$') ? null : actual;
}

const aliases = {};
for (const env of (options.env === 'all' ? ['prod', 'dev'] : [options.env])) {
  const ignored = (safeFile('.gitignore') ?? '').split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const overlayName = env === 'prod' ? 'compose.prod.yml' : 'compose.dev.yml';
  if (ignored.includes(overlayName)) check(env, 'delivery-ignore', 'fail', `${overlayName} is ignored by .gitignore and will not be delivered with the checkout.`, `Remove the ${overlayName} ignore rule before versioning the managed topology.`);
  const selection = plans[env].find(pair => pair.every(path => safeFile(path) !== null));
  if (!selection) {
    check(env, 'topology', 'fail', 'No complete managed Compose topology found.', `Add ${env === 'prod' ? 'compose.prod.yml' : 'compose.dev.yml'} beside compose.yml (or use a complete compose/ pair).`);
    check(env, 'managed-configuration', 'unverified', 'Encrypted operator configuration cannot be inspected by a static local doctor.', 'Use projectctl env validate for the saved managed configuration.');
    check(env, 'runtime', 'unverified', 'Runtime and public reachability cannot be verified without a complete topology and projectctl doctor.');
    continue;
  }
  check(env, 'topology', 'pass', `Selected ${selection.join(' + ')}.`);
  const parsed = selection.map(path => parse(safeFile(path)));
  if (parsed.some(model => model === null)) {
    check(env, 'compose-syntax', 'unverified', "Compose syntax or feature outside the static doctor's supported subset.", 'Validate the selected pair with the operator Compose config/doctor.');
    continue;
  }
  const services = new Map();
  const networks = new Map();
  for (const model of parsed) {
    for (const name of model.serviceNames) services.set(name, `${services.get(name) ?? ''}\n${model.service(name)}`);
    for (const name of model.networks) networks.set(name, `${networks.get(name) ?? ''}\n${model.network(name)}`);
  }
  const name = frontend(services, env);
  const body = name && services.get(name);
  if (!body) { check(env, 'frontend', 'fail', 'No frontend service in selected topology.', 'Define a runnable frontend for this environment.'); continue; }
  const runnable = /\b(?:build|image):\s*(?:\S+)?/m.test(body);
  check(env, 'frontend', runnable ? 'pass' : 'fail', runnable ? `Frontend service: ${name}.` : `Service ${name} has no image or build context.`, 'Provide a build context or image.');
  if (env === 'prod' && selection.length > 1) {
    const expected = ['frontend-prod', 'api-prod'];
    const missing = expected.filter(service => !services.has(service));
    check(env, 'operator-overlay', missing.length ? 'fail' : 'pass', missing.length ? `Operator-generated prod overlay targets ${missing.join(', ')}, absent from the selected topology.` : 'Operator-generated prod service targets are present.', 'Supply runnable services compatible with the operator or request frontend-only support; do not add a dummy API.');
  }
  if (selection.length > 1) {
    const apiName = env === 'prod' ? 'api-prod' : 'api-dev';
    const api = services.get(apiName) ?? '';
    check(env, 'api-service', /\b(?:build|image):\s*\S+/m.test(api) ? 'pass' : 'fail', /\b(?:build|image):\s*\S+/m.test(api) ? `${apiName} has a build or image declaration.` : `${apiName} is not runnable after the operator adds its runtime overlay.`, 'Provide a real backend or request frontend-only support in the operator; do not add a dummy API.');
  }
  if (env === 'dev' && /(?:sleep\s+infinity|command:\s*\[\s*["']sleep["']\s*,\s*["']infinity["']\s*\]|tail\s+-f\s+\/dev\/null)/i.test(services.get('api-dev') ?? '')) {
    check(env, 'api-placeholder', 'fail', 'api-dev is an idle placeholder, not a running API.', 'Remove the placeholder and align the operator service model with a frontend-only project.');
  }
  const target = scalar(body, 'target');
  if (target) {
    const context = scalar(body, 'context') || '.';
    const dockerfile = scalar(body, 'dockerfile') || 'Dockerfile';
    const dockerPath = resolve(root, dirname(selection.at(-1)), context, dockerfile);
    const dockerSource = pathWithinRoot(dockerPath) ? safeFile(relative(root, dockerPath)) : null;
    check(env, 'build-target', dockerSource === null ? 'unverified' : new RegExp(`^FROM\\s+[^\\n]+\\s+AS\\s+${target}\\s*$`, 'im').test(dockerSource) ? 'pass' : 'fail', dockerSource === null ? 'Dockerfile could not be resolved statically.' : `Dockerfile target ${target} ${new RegExp(`^FROM\\s+[^\\n]+\\s+AS\\s+${target}\\s*$`, 'im').test(dockerSource) ? 'exists' : 'is missing'}.`, 'Check build context, Dockerfile path and stage name.');
  }
  if (env === 'dev' && name === 'frontend' && !/\bprofiles:\s*\n[\s\S]*?\bprod\b/.test(body)) {
    check(env, 'dev-service', 'unverified', 'Dev uses the production-named frontend; verify target/profile after Compose merge.', 'Prefer an explicit frontend-dev service or inspect effective config.');
  }
  if (env === 'dev' && name !== 'frontend') {
    const prodBody = services.get('frontend');
    if (prodBody && !/\bprofiles:\s*\n\s*-\s*(?:prod|root-prod)\b/.test(prodBody)) check(env, 'prod-isolation', 'fail', 'Prod frontend is also active in dev.', 'Profile out frontend in the dev overlay.');
    else check(env, 'prod-isolation', 'pass', 'Prod frontend excluded from the dev default model.');
  }
  const portKey = env === 'prod' ? 'FRONTEND_PORT' : 'FRONTEND_DEV_PORT';
  const ports = listValues(body, 'ports');
  const mapping = ports.find(value => value.includes(`\${${portKey}}`));
  check(env, 'frontend-port', mapping ? 'pass' : 'fail', mapping ? `${name} interpolates ${portKey}.` : `${name} does not publish ${portKey}.`, `Map \${${portKey}} to the actual frontend container port.`);
  if (mapping) check(env, 'container-port', /:4321(?:\/tcp)?$/.test(mapping) ? 'pass' : 'unverified', /:4321(?:\/tcp)?$/.test(mapping) ? 'Frontend publishes container port 4321.' : 'Container port differs from the current managed edge convention (4321).', 'Check the operator origin port and actual container listener.');
  const envFile = env === 'prod' ? '.env' : '.env.dev';
  const localConfig = safeFile(envFile);
  const keys = envKeys(localConfig);
  const port = keys.get(portKey);
  check(env, 'managed-configuration', 'unverified', 'Encrypted operator configuration cannot be inspected by a static local doctor.', 'Use projectctl env validate for the saved managed configuration.');
  if (localConfig !== null) check(env, 'local-port', /^\d+$/.test(port ?? '') && +port > 0 && +port < 65536 ? 'pass' : 'fail', /^\d+$/.test(port ?? '') && +port > 0 && +port < 65536 ? `${envFile} has a valid ${portKey}.` : `${envFile} lacks a valid ${portKey}.`, `Set ${portKey} to a valid host port in ${envFile}; do not commit secrets.`);
  else check(env, 'local-port', 'unverified', `${envFile} absent; managed config may exist in operator storage.`);
  const edgeName = [...networks.keys()].find(key => /\bexternal:\s*true\b/.test(networks.get(key)));
  const edgeBody = body.match(new RegExp(`^\\s*${edgeName || 'edge'}:\\s*\\n((?:\\s+[^\\n]+\\n?)*)`, 'm'))?.[1] ?? '';
  const alias = networkAlias(edgeBody)[0] ?? '';
  if (!edgeName || !alias) check(env, 'edge-alias', 'unverified', 'No external edge network and frontend alias confirmed.', 'Required when an operator hostname is assigned; configure an external network and distinct alias.');
  else {
    aliases[env] = interpolate(alias, keys);
    check(env, 'edge-alias', aliases[env] ? 'pass' : 'unverified', aliases[env] ? 'External edge network and local alias resolved.' : 'Edge alias references a value unavailable locally.', 'Check the operator assignment and managed environment configuration.');
  }
  check(env, 'runtime', 'unverified', 'Running services, origin, tunnel and public URL require projectctl doctor.', 'Run projectctl doctor from the authenticated project terminal.');
}
if (aliases.dev && aliases.prod && aliases.dev === aliases.prod) check('all', 'alias-isolation', 'fail', 'Dev and prod resolve to the same edge alias.', 'Use distinct aliases per environment.');
else if (options.env === 'all') check('all', 'alias-isolation', aliases.dev && aliases.prod ? 'pass' : 'unverified', aliases.dev && aliases.prod ? 'Edge aliases differ.' : 'Cannot compare both edge aliases without operator configuration.');
const summary = Object.fromEntries(['prod', 'dev'].filter(e => options.env === 'all' || options.env === e).map(env => [env, {
  passed: results.filter(c => c.env === env && c.status === 'pass').length,
  failed: results.filter(c => c.env === env && c.status === 'fail').length,
  unverified: results.filter(c => c.env === env && c.status === 'unverified').length,
}]));
const report = { schemaVersion: 1, root, summary, checks: results };
if (options.json) console.log(JSON.stringify(report, null, 2));
else for (const item of results) console.log(`[${item.status.toUpperCase()}] ${item.env}/${item.id}: ${item.message}${item.remediation ? ` Fix: ${item.remediation}` : ''}`);
process.exitCode = results.some(c => c.status === 'fail') ? 1 : 0;
