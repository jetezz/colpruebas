// @ac HRM-01
// @ac HRM-02
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

describe('Home runtime metadata contract', () => {
  it('passes a visible git branch reference to the status card', () => {
    expect(indexSource).toContain("const gitBranch = 'MAIN';");
    expect(indexSource).toContain('gitBranch={gitBranch}');
  });

  it('creates the footer timestamp as an ISO 8601 server-render value', () => {
    expect(indexSource).toContain('const timestamp = new Date().toISOString();');
    expect(indexSource).toContain('<Footer timestamp={timestamp} />');
    expect(footerSource).toContain('{timestamp}');
  });
});
