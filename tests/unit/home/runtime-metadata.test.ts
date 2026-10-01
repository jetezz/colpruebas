// @ac HRM-01, HRM-02, HSS-04
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const indexSource = readFileSync(
  join(import.meta.dir, '../../../frontend/src/pages/index.astro'),
  'utf8',
);
const footerSource = readFileSync(
  join(import.meta.dir, '../../../frontend/src/components/Footer.astro'),
  'utf8',
);
const infoCardSource = readFileSync(
  join(import.meta.dir, '../../../frontend/src/components/InfoCard.astro'),
  'utf8',
);

describe('Home runtime metadata contract', () => {
  it('resuelve la rama real via PUBLIC_GIT_BRANCH con fallback develop', () => {
    expect(indexSource).toContain('import.meta.env.PUBLIC_GIT_BRANCH');
    expect(indexSource).toContain("'develop'");
    expect(indexSource).toContain('gitBranch={gitBranch}');
    expect(infoCardSource).toContain('Rama Git:');
  });

  it('no renderiza MAIN en ningun entorno (cero MAIN operativo)', () => {
    expect(indexSource).not.toContain('MAIN');
    expect(infoCardSource).not.toContain('MAIN');
  });

  it('mantiene entorno alineado sin console.error en el path SSR', () => {
    expect(indexSource).toContain('import.meta.env.PUBLIC_ENVIRONMENT');
    expect(indexSource).not.toMatch(/console\.error\s*\(/);
  });

  it('creates the footer timestamp as an ISO 8601 server-render value', () => {
    expect(indexSource).toContain('const timestamp = new Date().toISOString();');
    expect(indexSource).toContain('<Footer timestamp={timestamp} />');
    expect(footerSource).toContain('{timestamp}');
    expect(new Date().toISOString()).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});
