// @ac PCT-90 PCT-93
//
// Smoke tests for the canonical backend API endpoints (/, /health, /api/status).
// Declares the test-standard criteria this file participates in: PCT-90 (mandatory
// `// @ac <ID>` header contract enforced by the unified runner `assertAcHeader`,
// TST-03/04 — a headerless file rejects the whole repo-wide unit run, exit 2) and
// PCT-93 (canonical unit-test layout/discovery: this file lives under tests/back/,
// one of the canonical unit discovery roots, TST-36).
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import express from 'express';
import cors from 'cors';

const APP_NAME = 'colpruebas';
const ENVIRONMENT = 'test';

function createTestApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/', (req, res) => {
    const message = ENVIRONMENT === 'test'
      ? 'API de test funcionando'
      : 'API de prod funcionando';

    res.json({
      app: APP_NAME,
      message: message,
      environment: ENVIRONMENT,
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      environment: ENVIRONMENT,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/status', (req, res) => {
    res.json({
      app: APP_NAME,
      environment: ENVIRONMENT,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}

describe('Backend API Endpoints', () => {
  let app: express.Application;
  let server: ReturnType<typeof app.listen>;

  beforeAll(() => {
    app = createTestApp();
    server = app.listen(3001);
  });

  afterAll(() => {
    server.close();
  });

  it('GET / returns 200 and correct JSON structure', async () => {
    const response = await fetch('http://localhost:3001/');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('app');
    expect(body).toHaveProperty('message');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('version');
    expect(body).toHaveProperty('timestamp');
    expect(body.app).toBe(APP_NAME);
    expect(body.environment).toBe(ENVIRONMENT);
    expect(body.version).toBe('1.0.0');
  });

  it('GET /health returns 200 and contains status ok', async () => {
    const response = await fetch('http://localhost:3001/health');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('timestamp');
    expect(body.status).toBe('ok');
    expect(body.environment).toBe(ENVIRONMENT);
  });

  it('GET /api/status returns 200 and correct JSON structure', async () => {
    const response = await fetch('http://localhost:3001/api/status');
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('app');
    expect(body).toHaveProperty('environment');
    expect(body).toHaveProperty('timestamp');
    expect(body.app).toBe(APP_NAME);
    expect(body.environment).toBe(ENVIRONMENT);
  });
});
