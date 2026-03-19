import { test, expect } from '@playwright/test';

test.describe('API Tests', () => {
  test('GET /api/ returns JSON with app="colpruebas", environment and version', async ({ request }) => {
    const response = await request.get(`/api/`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.app).toBe('colpruebas');
    expect(json).toHaveProperty('environment');
    expect(json).toHaveProperty('version');
  });

  test('GET /api/health returns status="ok"', async ({ request }) => {
    const response = await request.get(`/api/health`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.status).toBe('ok');
  });

  test('GET /api/status returns JSON with app and environment', async ({ request }) => {
    const response = await request.get(`/api/status`);
    expect(response.status()).toBe(200);

    const json = await response.json();
    expect(json.app).toBe('colpruebas');
    expect(json).toHaveProperty('environment');
  });
});
