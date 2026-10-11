import { describe, expect, test } from 'bun:test';
import { patchFile } from './update-test-status.ts';
import type { View } from './test-contract.ts';

const view: View = {
  id: 'dashboard', name: 'Dashboard', slug: 'dashboard',
  features: [{ name: 'Overview', criteria: [{ id: 'DASH-001', description: 'Overview', type: 'frontend' }] }],
};
const prefix = 'schema_version: 1\nfeatures:\n  - name: Overview\n    criteria:\n      - id: DASH-001\n        test:\n          type: UNIT\n          ';

describe('update-test-status patching', () => {
  test('rejects block scalars without returning modified content', () => {
    for (const indicator of ['>-', '|', '>+2']) {
      const source = `${prefix}status: ${indicator}\n            sin-test\n`;
      expect(() => patchFile(view, 'dashboard.yaml', source, ['DASH-001'], 'verde'))
        .toThrow('status block scalars are not supported');
      expect(typeof Bun.YAML.parse(source).features[0].criteria[0].test.status).toBe('string');
    }
  });

  test.each([
    ['plain', 'sin-test', 'verde'],
    ['double quoted', '"sin-test"', '"verde"'],
    ['single quoted', "'sin-test'", "'verde'"],
  ])('updates %s scalars locally', (_label, scalar, expected) => {
    const source = `${prefix}status: ${scalar} # keep\n`;
    const result = patchFile(view, 'dashboard.yaml', source, ['DASH-001'], 'verde');
    expect(result.content.replace(`status: ${expected}`, `status: ${scalar}`)).toBe(source);
    expect(Bun.YAML.parse(result.content).features[0].criteria[0].test.status).toBe('verde');
  });

  test('rejects malformed scalar syntax', () => {
    const source = `${prefix}status: \n`;
    expect(() => patchFile(view, 'dashboard.yaml', source, ['DASH-001'], 'verde')).toThrow();
  });
});
