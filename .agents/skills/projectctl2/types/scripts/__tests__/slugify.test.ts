import { expect, test } from 'bun:test';
import { slugify } from '../slugify.ts';

// Canonical slug contract (requirements/docs/SKILL.md 2.2.1):
// NFKD -> strip diacritics -> lowercase -> [^a-z0-9]+ to '-' -> trim '-'.
// Strict: no truncation, no fallback; empty input maps to empty output.

test('NFKD strips accents: cafe, arbol, nono', () => {
  expect(slugify('Café')).toBe('cafe');
  expect(slugify('Árbol Ñoño')).toBe('arbol-nono');
  expect(slugify('ñ')).toBe('n');
});

test('non-alphanumeric sequences become one dash and edges trim', () => {
  expect(slugify('  Hello, World!  ')).toBe('hello-world');
  expect(slugify('---')).toBe('');
  expect(slugify('--a--b--')).toBe('a-b');
});

test('empty input maps to empty output (validators flag invalid)', () => {
  expect(slugify('')).toBe('');
});

test('strict lib does not truncate long input', () => {
  const long = 'a'.repeat(100);
  expect(slugify(long)).toBe(long);
});

// Drift guard: canonical strips ALL Unicode marks (general category M),
// not just U+0300-U+036F. The marks below are built from code points to
// keep the source readable; both are Mn outside U+0300-U+036F, so between
// letters they must vanish (old init regex kept them and gave 'a-b').
const markExtended = String.fromCharCode(0x1ab0);
const markSymbol = String.fromCharCode(0x20d7);
test('strips marks outside U+0300-U+036F (Mark equivalence)', () => {
  expect(slugify('a' + markExtended + 'b')).toBe('ab');
  expect(slugify('a' + markSymbol + 'b')).toBe('ab');
});
