// Canonical slug derivation (requirements/docs/SKILL.md 2.2.1):
// NFKD -> strip diacritics -> lowercase -> [^a-z0-9]+ to '-' -> trim '-'.
// Strict: no truncation, no fallback; empty input yields empty output so
// validators can flag the navigation as invalid. Truncation and fallback
// live in callers that need them (sdd/task init), never here.

export function slugify(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
