// @ac HSS-01
// @ac HSS-02
// @ac HSS-03
// @ac HSS-04
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cardSource = readFileSync(
  join(import.meta.dir, '../../../frontend/src/components/InfoCard.astro'),
  'utf8',
);

describe('Home status summary contract', () => {
  it.each([
    ['HSS-01', 'Aplicación:', 'appName'],
    ['HSS-02', 'Frontend:', 'frontendStatus'],
    ['HSS-03', 'API:', 'apiStatus'],
    ['HSS-04', 'Rama Git:', 'gitBranch'],
  ])('%s exposes the expected status row', (_id, label, prop) => {
    expect(cardSource).toContain(label);
    expect(cardSource).toContain(`{${prop}}`);
  });

  it('applies the selected environment to frontend, API, and branch values', () => {
    expect(cardSource).toContain('class={`value ${environment}`}');
    expect(cardSource).toContain('.value.production');
    expect(cardSource).toContain('.value.test');
  });
});
