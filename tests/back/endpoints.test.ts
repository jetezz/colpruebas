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
