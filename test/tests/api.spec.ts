import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:3006';

test.describe('API Tests (RED PHASE - implementation not yet written)', () => {
  test('GET / returns JSON with app="colpruebas", environment and version', async ({ request }) => {
    // TDD: red phase — implementation not yet written
    const response = await request.get(`${API_BASE_URL}/`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.app).toBe('colpruebas');
    expect(json).toHaveProperty('environment');
    expect(json).toHaveProperty('version');
  });

  test('GET /health returns status="ok"', async ({ request }) => {
    // TDD: red phase — implementation not yet written
    const response = await request.get(`${API_BASE_URL}/health`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.status).toBe('ok');
  });

  test('GET /api/status returns JSON with app and environment', async ({ request }) => {
    // TDD: red phase — implementation not yet written
    const response = await request.get(`${API_BASE_URL}/api/status`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.app).toBe('colpruebas');
    expect(json).toHaveProperty('environment');
  });
});
