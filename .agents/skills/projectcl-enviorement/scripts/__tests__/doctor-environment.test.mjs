import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const doctor = new URL('../project/doctor-environment.mjs', import.meta.url);

function fixture(files, env = 'all') {
  const root = mkdtempSync(join(tmpdir(), 'projectctl-environment-'));
  try {
    for (const [name, content] of Object.entries(files)) {
      const file = join(root, name);
      mkdirSync(join(file, '..'), { recursive: true });
      writeFileSync(file, content);
    }
    const process = spawnSync(processExecPath(), [doctor.pathname, '--root', root, '--env', env, '--json'], { encoding: 'utf8' });
    return { status: process.status, report: JSON.parse(process.stdout), raw: process.stdout };
  } finally { rmSync(root, { recursive: true, force: true }); }
}
function processExecPath() { return globalThis.process.execPath; }

const base = `services:\n  frontend:\n    image: nginx:alpine\n    ports:\n      - "\${FRONTEND_PORT}:4321"\n    networks:\n      edge:\n        aliases:\n          - \${EDGE_TUNNEL_ALIAS}\nnetworks:\n  edge:\n    external: true\n`;
const prod = `services:\n  frontend:\n    profiles:\n      - root-prod\n  frontend-prod:\n    image: nginx:alpine\n    ports:\n      - "\${FRONTEND_PORT}:4321"\n    networks:\n      edge:\n        aliases:\n          - \${EDGE_TUNNEL_ALIAS}\n  api-prod:\n    image: example/api:latest\n`;
const dev = `services:\n  frontend:\n    profiles:\n      - root-prod\n  frontend-dev:\n    image: example/dev:latest\n    ports:\n      - "\${FRONTEND_DEV_PORT}:4321"\n    networks:\n      edge:\n        aliases:\n          - \${DEV_EDGE_TUNNEL_ALIAS}\n  api-dev:\n    image: example/api:latest\nnetworks:\n  edge:\n    external: true\n`;

test('missing prod overlay fails even with runnable base Compose', () => {
  const result = fixture({ 'compose.yml': base, 'compose.dev.yml': dev }, 'prod');
  assert.equal(result.status, 1);
  assert.equal(result.report.checks.find(item => item.id === 'topology').status, 'fail');
});

test('complete topology does not certify remote runtime and never leaks env values', () => {
  const result = fixture({
    'compose.yml': base,
    'compose.prod.yml': prod,
    'compose.dev.yml': dev,
    '.env': 'FRONTEND_PORT=4323\nEDGE_TUNNEL_ALIAS=prod-edge\nSECRET=very-private-value',
    '.env.dev': 'FRONTEND_DEV_PORT=4324\nDEV_EDGE_TUNNEL_ALIAS=dev-edge',
  });
  assert.equal(result.status, 0);
  assert.equal(result.report.checks.find(item => item.id === 'alias-isolation').status, 'pass');
  assert.equal(result.report.checks.find(item => item.id === 'runtime').status, 'unverified');
  assert.equal(result.raw.includes('very-private-value'), false);
});

test('idle API placeholder is reported as a failed check', () => {
  const result = fixture({ 'compose.yml': base, 'compose.dev.yml': dev.replace('image: example/api:latest', 'image: busybox:latest\n    command: ["sleep", "infinity"]') }, 'dev');
  assert.equal(result.status, 1);
  assert.equal(result.report.checks.find(item => item.id === 'api-placeholder').status, 'fail');
});

test('ignored production overlay is not considered deliverable', () => {
  const result = fixture({ 'compose.yml': base, 'compose.prod.yml': prod, '.gitignore': 'compose.prod.yml\n' }, 'prod');
  assert.equal(result.status, 1);
  assert.equal(result.report.checks.find(item => item.id === 'delivery-ignore').status, 'fail');
});
