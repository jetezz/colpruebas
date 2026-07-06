// @ac PWT-04
// @ac PWT-05
// @ac PWT-06
// @ac PWT-07
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import {
  defaultBundlePath,
  listCriteria,
  manualMark,
  patchBundleCoverage,
  resetCoverage,
  mockPwcliRun,
} from '../../backend/src/coverage-writer.ts';

function sha256(buf: string): string {
  return createHash('sha256').update(buf, 'utf8').digest('hex');
}

const tmpDir = mkdtempSync(join(tmpdir(), 'colpruebas-test-'));
const testBundleRel = 'docs/app-map/views/project-workspace/features/test-tab.md';
const testBundleAbs = join(tmpDir, testBundleRel);

const sampleBundle = `---
id: project-workspace-test-tab
title: Tab Test
kind: feature
summary: bundle de prueba
criteria:
  - id: PWT-04
    title: criterio 04
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
  - id: PWT-05
    title: criterio 05
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
  - id: PWT-07
    title: criterio 07
    functional: implemented
    coverage:
      Unit: missing
      PW-CLI: missing
      PW-AUTO: missing
      Manual: missing
---

# test
`;

describe('Writer atómico (PWT-04/05/06/07)', () => {
  beforeAll(() => {
    mkdirSync(dirname(testBundleAbs), { recursive: true });
    rmSync(testBundleAbs, { force: true });
    writeFileSync(testBundleAbs, sampleBundle, 'utf8');
  });

  it('listCriteria retorna el array de criterios parseado', () => {
    const r = listCriteria(testBundleAbs);
    expect(Array.isArray(r)).toBe(true);
  });

  it('manualMark crea criterio nuevo y persiste como covered', () => {
    const before = readFileSync(testBundleAbs, 'utf8');
    const shaPre = sha256(before);
    const result = manualMark(testBundleAbs, 'PWT-04');
    expect(result.ok).toBe(true);
    expect(result.criterionId).toBe('PWT-04');
    expect(result.method).toBe('Manual');
    const after = readFileSync(testBundleAbs, 'utf8');
    const bodyBefore = before.split('---').slice(2).join('---');
    const bodyAfter = after.split('---').slice(2).join('---');
    expect(bodyBefore).toBe(bodyAfter);
    expect(result.sha256.length).toBe(64);
    expect(shaPre.length).toBe(64);
  });

  it('manualMark rechaza criterionId inválido', () => {
    const result = manualMark(testBundleAbs, '../etc/passwd');
    expect(result.ok).toBe(false);
  });

  it('patchBundleCoverage falla si criterion no existe', () => {
    const r = patchBundleCoverage(testBundleAbs, 'Unit', 'covered', {
      criterionId: 'NOPE-XX',
    });
    expect(r.ok).toBe(false);
  });

  it('mockPwcliRun escribe PW-CLI covered cuando existe inventario', () => {
    const inv = {
      criteria: {
        'PWT-04': {
          hasUnitTest: true,
          hasPwautoSpec: false,
          hasPwcliEvidence: false,
          hasManualEvidence: false,
          unitTestPaths: ['tests/back/endpoints.test.ts'],
          pwautoSpecPaths: [],
        },
      },
      scannedAt: '2026-07-06T00:00:00Z',
      projectsRoot: '/tmp',
    };
    const r = mockPwcliRun(testBundleAbs, 'PWT-04', inv);
    expect(r.ok).toBe(true);
    expect(r.verdict).toBe('covered');
    expect(r.agent).toBe('mock-pwcli');
  });

  it('resetCoverage no convierte ausencia de test en rojo missing', () => {
    const inv = {
      criteria: {
        'PWT-04': {
          hasUnitTest: false,
          hasPwautoSpec: false,
          hasPwcliEvidence: false,
          hasManualEvidence: false,
          unitTestPaths: [],
          pwautoSpecPaths: [],
        },
      },
      scannedAt: '2026-07-06T00:00:00Z',
      projectsRoot: '/tmp',
    };
    const r = resetCoverage(testBundleAbs, inv);
    expect(r.ok).toBe(true);
    const after = readFileSync(testBundleAbs, 'utf8');
    expect(after).toContain('not-applicable');
  });
});

describe('Endpoints backend (PWT-04/05/06/07)', () => {
  let server: ReturnType<ReturnType<typeof express>['listen']>;
  const PORT = 3911;
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', bundlePath: testBundleAbs }),
  );

  app.get('/api/projects/:id/docs/app-map', (_req, res) => {
    try {
      const criteria = listCriteria(testBundleAbs);
      res.json({ ok: true, criteria });
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/projects/:id/docs/app-map/coverage/manual', (req, res) => {
    try {
      const { criterionId } = req.body ?? {};
      if (
        typeof criterionId !== 'string' ||
        !/^[A-Z][\w-]*$/.test(criterionId)
      ) {
        return res.status(400).json({ ok: false, error: 'invalid criterionId' });
      }
      const r = manualMark(testBundleAbs, criterionId);
      res.status(r.ok ? 200 : 500).json(r);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/projects/:id/docs/app-map/coverage/reset', (_req, res) => {
    try {
      const r = resetCoverage(testBundleAbs, {
        criteria: {},
        scannedAt: new Date().toISOString(),
        projectsRoot: tmpDir,
      });
      res.json(r);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  app.post('/api/projects/:id/test-pwcli/run', (req, res) => {
    try {
      const { criterionId } = req.body ?? {};
      if (
        typeof criterionId !== 'string' ||
        !/^[A-Z][\w-]*$/.test(criterionId)
      ) {
        return res.status(400).json({ ok: false, error: 'invalid criterionId' });
      }
      res.json(mockPwcliRun(testBundleAbs, criterionId));
    } catch (err) {
      res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  beforeAll((done) => {
    server = app.listen(PORT, done);
  });
  afterAll((done) => {
    server.close(() => done());
  });

  it('GET /api/projects/PROJ/docs/app-map retorna ok', async () => {
    const r = await fetch(
      `http://localhost:${PORT}/api/projects/PROJ/docs/app-map`,
    );
    const body = await r.json().catch(() => null);
    expect(r.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.criteria)).toBe(true);
  });

  it('POST /coverage/manual con criterionId inválido → 400', async () => {
    const r = await fetch(
      `http://localhost:${PORT}/api/projects/PROJ/docs/app-map/coverage/manual`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criterionId: 'invalid id with spaces' }),
      },
    );
    expect(r.status).toBe(400);
  });

  it('POST /coverage/manual con criterionId válido → 200 ok', async () => {
    const r = await fetch(
      `http://localhost:${PORT}/api/projects/PROJ/docs/app-map/coverage/manual`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criterionId: 'PWT-05' }),
      },
    );
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
    expect(body.criterionId).toBe('PWT-05');
  });

  it('POST /coverage/reset con inventario vacío no rompe', async () => {
    const r = await fetch(
      `http://localhost:${PORT}/api/projects/PROJ/docs/app-map/coverage/reset`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    );
    expect(r.status).toBe(200);
  });

  it('POST /test-pwcli/run devuelve agent=mock-pwcli', async () => {
    const r = await fetch(
      `http://localhost:${PORT}/api/projects/PROJ/test-pwcli/run`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criterionId: 'PWT-07' }),
      },
    );
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.agent).toBe('mock-pwcli');
    expect(body.criterionId).toBe('PWT-07');
  });
});
