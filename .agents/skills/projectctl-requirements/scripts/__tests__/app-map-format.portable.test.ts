/**
 * app-map-format.portable.test.ts — Regresión portable del normalizador
 * `docs/app-map` frontmatter (3 tiers + gotcha `$`/backtick + round-trip de
 * `type` + guard de idempotencia sobre el corpus real).
 *
 * Paquete `projectctl-requirements` (portable, copy-tree-no-mods). La suite
 * es una factory inyectable (`defineAppMapFormatSuite`) parametrizada por
 * `repoRoot`/`appMapGlob`; el formatter (`normalizeFileText`,
 * `normalizeMarkdown`) y el parser estricto (`parseFrontmatter`,
 * `parseCriteriaFromFrontmatter`) se inyectan porque solo el parser estricto
 * del runtime tolera el corpus real. Este archivo NO tiene ningún import
 * estático hacia `sandbox/`: cualquier repo destino puede llamar a la factory
 * con su propio formatter/parser.
 *
 * Env (inyectable por el destino, no por este archivo):
 *   REPO_ROOT    (default: raíz del repo que contiene esta skill)
 *   APP_MAP_GLOB (default: glob de bundles docs/app-map)
 *
 * El wrapper local `<repo>/scripts/...` (proveído por el destino) invoca a
 * esta factory con su root y sus módulos.
 *
 * Este archivo es un GUARD de formato, no cobertura de criterios por `@ac`:
 * los fixtures son sintéticos salvo el último caso, que recorre los bundles
 * reales del glob y aserta idempotencia + parseabilidad post-formato.
 */

import { describe, expect, it } from 'bun:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';

// ---- deps inyectables -------------------------------------------------------

export type AppMapFormatDeps = {
  normalizeFileText: (text: string) => string;
  normalizeMarkdown: (text: string) => string;
  parseFrontmatter: (raw: string) => { frontmatter: { criteria?: unknown } };
  parseCriteriaFromFrontmatter: (criteria: unknown, file: string, errors: string[]) => unknown[];
};

export type AppMapFormatOptions = {
  repoRoot: string;
  appMapGlob: string;
};

type CriterionView = { coverage: Record<string, string>; type?: string };

// ---- suite factory ----------------------------------------------------------

export function defineAppMapFormatSuite(deps: AppMapFormatDeps, options: AppMapFormatOptions): void {
  const { normalizeFileText, normalizeMarkdown, parseFrontmatter, parseCriteriaFromFrontmatter } = deps;
  const { repoRoot, appMapGlob } = options;

  function strictErrors(content: string): string[] {
    const { frontmatter } = parseFrontmatter(content);
    const errors: string[] = [];
    parseCriteriaFromFrontmatter(frontmatter.criteria, 'fixture.md', errors);
    return errors;
  }

  function asCriteria(list: unknown[]): CriterionView[] {
    return list as CriterionView[];
  }

  describe('app-map-format: whitespace (Tier 0)', () => {
    it('normalizes CRLF, trailing whitespace and the final newline', () => {
      const input = 'a: 1\r\nb: 2\r\nc: 3  \r\n  d: 4\t\n';
      expect(normalizeFileText(input)).toBe('a: 1\nb: 2\nc: 3\n  d: 4\n');
    });

    it('collapses 3+ blank lines to one blank line and guarantees a single trailing newline', () => {
      expect(normalizeFileText('x\n\n\n\ny')).toBe('x\n\ny\n');
    });
  });

  describe('app-map-format: criteria reindent (Tier 1)', () => {
    it('fixes off-by-one list indent and off-by-one coverage values, and pulls a swallowed functional key out of a folded scalar', () => {
      const input = [
        '---',
        'id: x',
        'title: x',
        'kind: feature',
        'summary: x',
        'source_of_truth: app-map',
        'criteria:',
        '  - id: PRJ-25',
        '    title: t',
        '    type: ui',
        '    notes: >-',
        '      a line',
        '      b line',
        '     functional: partial',
        '    coverage:',
        '      Unit: covered',
        '      PW-CLI: missing',
        '       PW-AUTO: timeout',
        '      Manual: missing',
        '   - id: AC-101',
        '    title: broken',
        '    type: backend',
        '    functional: partial',
        '    coverage: {Unit: missing, PW-CLI: missing, PW-AUTO: covered, Manual: missing}',
        '---',
        '',
      ].join('\n');

      const formatted = normalizeMarkdown(input);

      expect(strictErrors(formatted)).toEqual([]);
      expect(formatted).toContain('    coverage:');
      expect(formatted).toContain('      PW-AUTO: timeout');
      expect(formatted).toContain('  - id: AC-101');
      expect(formatted).toContain('    functional: partial\n    coverage:\n      Unit: missing');
    });

    it('is idempotent (a second pass changes nothing)', () => {
      const input = [
        '---',
        'id: x',
        'title: x',
        'kind: feature',
        'summary: x',
        'source_of_truth: app-map',
        'criteria:',
        '   - id: TST-01',
        '    title: ok',
        '    functional: partial',
        '     coverage: {Unit: missing, PW-CLI: missing, PW-AUTO: missing, Manual: missing}',
        '---',
        '',
      ].join('\n');

      const once = normalizeMarkdown(input);
      expect(normalizeMarkdown(once)).toBe(once);
    });
  });

  describe('app-map-format: inline coverage expansion (Tier 2)', () => {
    it('expands `coverage: {…}` to block form so the strict runtime parser reads real states', () => {
      const input = [
        '---',
        'id: x',
        'title: x',
        'kind: feature',
        'summary: x',
        'source_of_truth: app-map',
        'criteria:',
        '  - id: TSK-01',
        '    title: ok',
        '    type: backend',
        '    functional: partial',
        '    coverage: {Unit: missing, PW-CLI: missing, PW-AUTO: covered, Manual: missing}',
        '---',
        '',
      ].join('\n');

      const formatted = normalizeMarkdown(input);
      const { frontmatter } = parseFrontmatter(formatted);
      const errors: string[] = [];
      const criteria = asCriteria(parseCriteriaFromFrontmatter(frontmatter.criteria, 'x.md', errors));

      expect(errors).toEqual([]);
      expect(criteria[0]?.coverage['PW-AUTO']).toBe('covered');
      expect(formatted).not.toContain('coverage: {');
    });
  });

  describe('app-map-format: String.replace `$` expansion regression', () => {
    it('preserves `$`/backtick sequences inside scalar content (would corrupt via string replacer)', () => {
      const line = '`provider/model` (regex backend `^[^\\s/]+/[^\\s].+$`). `label` y';
      const input = [
        '---',
        'id: x',
        'title: x',
        'kind: feature',
        'summary: x',
        'source_of_truth: app-map',
        'criteria:',
        '  - id: MDL-11',
        '    title: ok',
        '    type: functionality',
        '    functional: partial',
        '    coverage:',
        '      Unit: missing',
        '      PW-CLI: missing',
        '      PW-AUTO: missing',
        '      Manual: missing',
        '    notes: >',
        `      ${line}`,
        '---',
        '',
      ].join('\n');

      const formatted = normalizeMarkdown(input);

      expect(strictErrors(formatted)).toEqual([]);
      expect(formatted).toContain(line);
      expect(formatted).not.toContain(`.+---\n`);
    });
  });

  describe('app-map-format: criterion `type` round-trip (AC-003 / T-3)', () => {
    it('preserves `type: functionality` at item level (indent 4) through normalize+re-emit, idempotent', () => {
      const input = [
        '---',
        'id: x',
        'title: x',
        'kind: feature',
        'summary: x',
        'source_of_truth: app-map',
        'criteria:',
        '  - id: PRJ-78d',
        '    title: ok',
        '    type: functionality',
        '    functional: partial',
        '    coverage: {Unit: missing, PW-CLI: missing, PW-AUTO: missing, Manual: missing}',
        '---',
        '',
      ].join('\n');

      const formatted = normalizeMarkdown(input);

      // `type` is NOT listed in ITEM_KEY_RE, so the normalizer re-emits it as a
      // generic item key at indent 4 — the emitted block keeps it byte-identical.
      expect(formatted).toContain('    type: functionality');

      const { frontmatter } = parseFrontmatter(formatted);
      const errors: string[] = [];
      const criteria = asCriteria(parseCriteriaFromFrontmatter(frontmatter.criteria, 'fixture.md', errors));
      expect(errors).toEqual([]);
      expect(criteria[0]?.type).toBe('functionality');

      // Idempotency: a second normalize pass changes nothing (T-8 invariant).
      expect(normalizeMarkdown(formatted)).toBe(formatted);
    });
  });

  describe('app-map-format: canonical bundles stay clean and idempotent (regression guard)', () => {
    it('reformatting the current canonical app-map yields no new strict-contract violations and is idempotent', async () => {
      const files = (await globby(appMapGlob, { cwd: repoRoot })).sort() as string[];
      const violations: string[] = [];

      for (const file of files) {
        const content = await fs.readFile(path.join(repoRoot, file), 'utf8');
        const once = normalizeMarkdown(content);
        if (content === once) continue;
        // Regression guard: whatever the formatter changes must stay parseable
        // and a second pass must settle (idempotency).
        const errors = strictErrors(once);
        if (errors.length > 0) violations.push(`${file}: ${errors.join('; ')}`);
        if (normalizeMarkdown(once) !== once) violations.push(`${file}: not idempotent`);
      }

      expect(violations).toEqual([]);
    });
  });
}
