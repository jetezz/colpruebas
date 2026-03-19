import { test, expect } from '@playwright/test';

// 🔴 RED PHASE: These tests will fail until implementation is complete
// API baseURL: http://localhost:3006

test.describe('API Tests (RED PHASE - implementation not yet written)', () => {
  test('GET / returns JSON with app="colpruebas", environment and version', async ({ request }) => {
    const response = await request.get(`/`);
    expect(response.status()).toBe(200);
    
    const json = await response.json();
    expect(json.app).toBe('colpruebas');
    expect(json).toHaveProperty('environment');
    expect(json).toHaveProperty('version');
  });

  test('GET /health returns status="ok"', async ({ request }) => {
    const response = await request.get(`/health`);
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
