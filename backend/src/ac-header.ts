export const AC_HEADER_LINE_RE = /^\s*\/\/\s*@ac\s+([A-Z][\w-]*)/m;
export const AC_TOKEN_RE = /\bac=([A-Z][\w-]*)/gi;
export const AC_RANGE_RE = /\bac=([A-Z][\w-]*)\s*,\s*([A-Z][\w-]*)/gi;
export const PW_DESCRIBE_RE = /test\.describe\(\s*['"`]([^'"`]+)['"`]/;
export const PW_ANNOTATION_RE =
  /test\.info\(\)\.annotations(?:\.push)?\(\s*\{\s*type:\s*['"`](?:ac|pwt)['"`]\s*,\s*description:\s*['"`]([A-Z][\w-]*)['"`]/;

export function extractAcTokensFromBun(source: string): string[] {
  const tokens = new Set<string>();
  const firstLineMatch = source.match(AC_HEADER_LINE_RE);
  if (firstLineMatch) tokens.add(firstLineMatch[1]);
  let m: RegExpExecArray | null;
  AC_RANGE_RE.lastIndex = 0;
  while ((m = AC_RANGE_RE.exec(source))) {
    tokens.add(m[1]);
    tokens.add(m[2]);
  }
  AC_TOKEN_RE.lastIndex = 0;
  while ((m = AC_TOKEN_RE.exec(source))) {
    tokens.add(m[1]);
  }
  return [...tokens];
}

export function extractAcTokensFromPlaywright(source: string): string[] {
  const tokens = new Set<string>();
  let m: RegExpExecArray | null;
  PW_ANNOTATION_RE.lastIndex = 0;
  while ((m = PW_ANNOTATION_RE.exec(source))) {
    tokens.add(m[1]);
  }
  return [...tokens];
}
