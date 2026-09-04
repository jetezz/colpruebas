import express from 'express';
import cors from 'cors';
import { existsSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultBundlePath,
  defaultProjectsRoot,
  listCriteria,
  manualMark,
  mockPwcliRun,
  patchBundleCoverage,
  resetCoverage,
  type CoverageMethod,
  type AppMapCoverageState,
} from './coverage-writer.ts';
import { buildInventory } from './test-inventory.ts';

const app = express();
const PORT = process.env.PORT || 3000;

const APP_NAME = process.env.APP_NAME || 'colpruebas';
const ENVIRONMENT = process.env.ENVIRONMENT || 'production';

const here = dirname(fileURLToPath(import.meta.url));
const envRoot = process.env.PROJECTS_ROOT;
const projectsRoot =
  envRoot && envRoot.length > 0
    ? envRoot
    : (() => {
        const twoUp = join(here, '..', '..');
        if (existsSync(join(twoUp, 'docs', 'app-map'))) return twoUp;
        const oneUp = join(here, '..');
        if (existsSync(join(oneUp, 'docs', 'app-map'))) return oneUp;
        return process.cwd();
      })();

function safeId(id: unknown): string | null {
  if (typeof id !== 'string') return null;
  if (!/^[a-zA-Z0-9-]{6,64}$/.test(id)) return null;
  return id;
}

function safeRelBundle(p: unknown): string {
  if (typeof p !== 'string') return defaultBundlePath();
  if (p.includes('..')) return defaultBundlePath();
  if (!p.endsWith('.md')) return defaultBundlePath();
  return p;
}

app.use(cors());
app.use(express.json({ limit: '256kb' }));

app.get('/', (req, res) => {
  const message =
    ENVIRONMENT === 'test' || ENVIRONMENT === 'development'
      ? 'API de test funcionando'
      : 'API de prod funcionando';

  res.json({
    app: APP_NAME,
    message,
    environment: ENVIRONMENT,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    app: APP_NAME,
    environment: ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/projects/:id/docs/app-map', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  try {
    const bundleRel = safeRelBundle(req.query.bundle);
    const bundleAbs = join(projectsRoot, bundleRel);
    const raw = readFileSync(bundleAbs, 'utf8');
    const parsed = matter(raw);
    const navigationRel = 'docs/app-map/navigation.yaml';
    let navigation = null;
    try {
      const navRaw = readFileSync(join(projectsRoot, navigationRel), 'utf8');
      const navParsed = matter(navRaw);
      navigation = navParsed.data;
    } catch {
      navigation = null;
    }
    res.json({
      ok: true,
      projectId: id,
      bundle: bundleRel,
      criteria: parsed.data.criteria ?? [],
      navigation,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.get('/api/projects/:id/test-inventory', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  try {
    const inv = buildInventory(projectsRoot);
    res.json({
      ok: true,
      projectId: id,
      criteria: inv.criteria,
      scannedAt: inv.scannedAt,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.post('/api/projects/:id/docs/app-map/coverage/manual', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  const body = (req.body ?? {}) as {
    criterionId?: string;
    bundlePath?: string;
  };
  if (
    !body.criterionId ||
    !/^[A-Z][\w-]*$/.test(body.criterionId)
  ) {
    res.status(400).json({ ok: false, error: 'invalid criterionId' });
    return;
  }
  const bundleRel = safeRelBundle(body.bundlePath);
  const bundleAbs = join(projectsRoot, bundleRel);
  const result = manualMark(bundleAbs, body.criterionId);
  if (!result.ok) {
    res.status(500).json(result);
    return;
  }
  res.json(result);
});

app.post('/api/projects/:id/docs/app-map/coverage/reset', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  const body = (req.body ?? {}) as { bundlePath?: string };
  const bundleRel = safeRelBundle(body.bundlePath);
  const bundleAbs = join(projectsRoot, bundleRel);
  const inv = buildInventory(projectsRoot);
  const result = resetCoverage(bundleAbs, inv);
  res.json(result);
});

app.post('/api/projects/:id/test-pwcli/run', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  const body = (req.body ?? {}) as {
    criterionId?: string;
    bundlePath?: string;
  };
  if (
    !body.criterionId ||
    !/^[A-Z][\w-]*$/.test(body.criterionId)
  ) {
    res.status(400).json({ ok: false, error: 'invalid criterionId' });
    return;
  }
  const bundleRel = safeRelBundle(body.bundlePath);
  const bundleAbs = join(projectsRoot, bundleRel);
  if (req.query.fallback === '1') {
    res.status(503).json({
      ok: false,
      code: 'agent_unavailable',
      prompt: JSON.stringify(
        {
          projectId: id,
          criterionId: body.criterionId,
          bundlePath: bundleRel,
          viewTab: `/project/${id}?tab=test`,
        },
        null,
        2,
      ),
      message:
        'OpenCode not available in this managed project; copy the prompt manually',
    });
    return;
  }
  const inv = buildInventory(projectsRoot);
  const result = mockPwcliRun(bundleAbs, body.criterionId, inv);
  res.json(result);
});

app.get('/api/projects/:id/docs/app-map/coverage', (req, res) => {
  const id = safeId(req.params.id);
  if (!id) {
    res.status(400).json({ ok: false, error: 'invalid project id' });
    return;
  }
  try {
    const bundleRel = safeRelBundle(req.query.bundle);
    const bundleAbs = join(projectsRoot, bundleRel);
    const criteria = listCriteria(bundleAbs);
    res.json({ ok: true, projectId: id, criteria });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `[${APP_NAME}] ${ENVIRONMENT} API server running on port ${PORT}`,
  );
});
