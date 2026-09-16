// @ac HOME-01
// @ac HOME-05
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const indexSource = readFileSync(
  join(import.meta.dir, '../../../frontend/src/pages/index.astro'),
  'utf8',
);

describe('Home landing contract', () => {
  it('identifies the application in the document title and main card', () => {
    expect(indexSource).toContain("const appName = 'colpruebas';");
    expect(indexSource).toContain('<title>{appName}</title>');
    expect(indexSource).toContain('<Header title={appName} />');
    expect(indexSource).toContain('<InfoCard');
    expect(indexSource).toContain('appName={appName}');
  });

  it('renders the landing without client-side error-producing code', () => {
    expect(indexSource).not.toContain('console.error');
    expect(indexSource).not.toContain('window.');
    expect(indexSource).not.toContain('document.');
  });
});
