// @ac PCT-95 PCT-96 PCT-97 PCT-98 PCT-99 PCT-100
//
// Unit test for the projectctl entorno contract (AC-001 / REQ-ENT-001..004/007).
// Closes the F5 coverage-mapping gap for the entorno family criteria (PCT-95..100)
// that had no unit file declaring their tokens:
//   - PCT-95 — docs prerrequisitos: docs/00-context/entornos.md + docs/02-features/tunnel.md
//   - PCT-96 — canonical overlays compose.yml (prod, target: prod) / compose.dev.yml
//     (dev, target: dev) with services frontend+api and port "${FRONTEND_PORT}:4321"
//   - PCT-97 — FRONTEND_PORT=4321 obligatorio en .env / .env.dev / .env.example
//   - PCT-98 — edge network mis-proyectos-edge external:true + per-env aliases
//   - PCT-99 — sandbox-runtime-policy: no docker CLI/socket, runtime exclusivo vía projectctl
//   - PCT-100 — .env.example declara FRONTEND_PORT (4321) como referencia canónica
//
// The first 10 lines are reserved for the `@ac` header because the runner
// (`scripts/test-runner.ts` assertAcHeader) only scans that range and rejects the file
// with exit 2 when the header is missing (PCT-90 / TST-03/04).

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs';

const PROJECT_ID = '511a017a-01d4-4553-a063-ba01438b15cd';
const REPO_ROOT = `/workspace/projects/${PROJECT_ID}`;

const COMPOSE_PROD_PATH = `${REPO_ROOT}/compose.yml`;
const COMPOSE_DEV_PATH = `${REPO_ROOT}/compose.dev.yml`;
const ENV_EXAMPLE_PATH = `${REPO_ROOT}/.env.example`;
const ENV_PATH = `${REPO_ROOT}/.env`;
const ENV_DEV_PATH = `${REPO_ROOT}/.env.dev`;
const ENTORNOS_DOC_PATH = `${REPO_ROOT}/docs/00-context/entornos.md`;
const TUNNEL_DOC_PATH = `${REPO_ROOT}/docs/02-features/tunnel.md`;
const SANDBOX_SKILL_PATH = `${REPO_ROOT}/.agents/skills/sandbox-runtime-policy/SKILL.md`;

const EDGE_NETWORK_NAME = 'mis-proyectos-edge';

function readFile(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
}

interface ComposeLike {
  services?: Record<string, unknown>;
  networks?: Record<string, unknown>;
}

function parseCompose(absPath: string): ComposeLike | null {
  const raw = readFile(absPath);
  if (raw === null) return null;
  try {
    return Bun.YAML.parse(raw) as ComposeLike;
  } catch {
    return null;
  }
}

interface ServiceLike {
  build?: { target?: unknown };
  ports?: unknown[];
  networks?: Record<string, { aliases?: unknown[] } | null>;
}

describe('colpruebas managed project · projectctl entorno contract (AC-001 / REQ-ENT-001..004/007)', () => {
  const prod = parseCompose(COMPOSE_PROD_PATH);
  const dev = parseCompose(COMPOSE_DEV_PATH);
  const envExampleRaw = readFile(ENV_EXAMPLE_PATH);
  const envRaw = readFile(ENV_PATH);
  const envDevRaw = readFile(ENV_DEV_PATH);
  const sandboxSkillRaw = readFile(SANDBOX_SKILL_PATH);

  it('PCT-95: docs/00-context/entornos.md exists (overlays canónicos + FRONTEND_PORT + edge + runtime)', () => {
    expect(fs.existsSync(ENTORNOS_DOC_PATH)).toBe(true);
    const raw = readFile(ENTORNOS_DOC_PATH) ?? '';
    expect(raw).toMatch(/FRONTEND_PORT/);
  });

  it('PCT-95: docs/02-features/tunnel.md exists (alias por entorno y guardrail)', () => {
    expect(fs.existsSync(TUNNEL_DOC_PATH)).toBe(true);
  });

  it('PCT-96: compose.yml (prod) parses and declares services frontend + api', () => {
    expect(prod).not.toBeNull();
    expect(Object.keys(prod?.services ?? {})).toEqual(expect.arrayContaining(['frontend', 'api']));
  });

  it('PCT-96: compose.yml frontend uses build target prod and port "${FRONTEND_PORT}:4321"', () => {
    const frontend = prod?.services?.frontend as ServiceLike | undefined;
    expect(frontend?.build?.target).toBe('prod');
    expect(frontend?.ports).toContain('${FRONTEND_PORT}:4321');
  });

  it('PCT-96: compose.dev.yml (dev) parses and declares services frontend + api', () => {
    expect(dev).not.toBeNull();
    expect(Object.keys(dev?.services ?? {})).toEqual(expect.arrayContaining(['frontend', 'api']));
  });

  it('PCT-96: compose.dev.yml frontend uses build target dev (HMR) and port "${FRONTEND_PORT}:4321"', () => {
    const frontend = dev?.services?.frontend as ServiceLike | undefined;
    expect(frontend?.build?.target).toBe('dev');
    expect(frontend?.ports).toContain('${FRONTEND_PORT}:4321');
  });

  it('PCT-97: .env.example exists and declares FRONTEND_PORT=4321 (firma commitada)', () => {
    expect(envExampleRaw).not.toBeNull();
    expect(envExampleRaw).toMatch(/^FRONTEND_PORT=4321$/m);
  });

  it('PCT-97: .env local declares FRONTEND_PORT=4321 (prod runtime)', () => {
    expect(envRaw).not.toBeNull();
    expect(envRaw).toMatch(/^FRONTEND_PORT=4321$/m);
  });

  it('PCT-97: .env.dev local declares FRONTEND_PORT=4321 (dev runtime)', () => {
    expect(envDevRaw).not.toBeNull();
    expect(envDevRaw).toMatch(/^FRONTEND_PORT=4321$/m);
  });

  it('PCT-98: compose.yml declares the edge network mis-proyectos-edge as external', () => {
    const edge = (prod?.networks?.edge ?? null) as { external?: unknown; name?: unknown } | null;
    expect(edge?.external).toBe(true);
    expect(edge?.name).toBe(EDGE_NETWORK_NAME);
  });

  it('PCT-98: compose.yml frontend joins the edge network with the prod alias colpruebas-origin', () => {
    const frontend = prod?.services?.frontend as ServiceLike | undefined;
    const aliases = frontend?.networks?.edge?.aliases as unknown[] | undefined;
    expect(aliases).toContain('colpruebas-origin');
  });

  it('PCT-98: compose.dev.yml declares the edge network mis-proyectos-edge as external', () => {
    const edge = (dev?.networks?.edge ?? null) as { external?: unknown; name?: unknown } | null;
    expect(edge?.external).toBe(true);
    expect(edge?.name).toBe(EDGE_NETWORK_NAME);
  });

  it('PCT-98: compose.dev.yml frontend joins the edge network with the dev alias test-colpruebas-origin', () => {
    const frontend = dev?.services?.frontend as ServiceLike | undefined;
    const aliases = frontend?.networks?.edge?.aliases as unknown[] | undefined;
    expect(aliases).toContain('test-colpruebas-origin');
  });

  it('PCT-99: sandbox-runtime-policy SKILL.md exists', () => {
    expect(sandboxSkillRaw).not.toBeNull();
  });

  it('PCT-99: sandbox skill declares exclusive runtime control via projectctl', () => {
    expect(sandboxSkillRaw).toMatch(/projectctl/);
    expect(sandboxSkillRaw).toMatch(/exclusivamente\*\* vía\s+`projectctl`/s);
  });

  it('PCT-99: sandbox skill declares the no-docker rule (no docker CLI nor docker.sock)', () => {
    expect(sandboxSkillRaw).toContain('docker.sock');
    expect(sandboxSkillRaw).toContain('docker: command not found');
  });

  it('PCT-100: .env.example declares FRONTEND_PORT as the canonical installed reference (4321)', () => {
    expect(envExampleRaw).toMatch(/^FRONTEND_PORT=4321$/m);
    expect(envExampleRaw ?? '').not.toMatch(/^FRONTEND_PORT=(?!4321)\d+$/m);
  });
});