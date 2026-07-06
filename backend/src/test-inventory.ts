import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import {
  AC_HEADER_LINE_RE,
  PW_ANNOTATION_RE,
  PW_DESCRIBE_RE,
} from './ac-header.ts';

export interface CriterionInventory {
  hasUnitTest: boolean;
  hasPwautoSpec: boolean;
  hasPwcliEvidence: boolean;
  hasManualEvidence: boolean;
  unitTestPaths: string[];
  pwautoSpecPaths: string[];
}

export interface Inventory {
  criteria: Record<string, CriterionInventory>;
  scannedAt: string;
  projectsRoot: string;
}

const UNIT_TEST_FILE_RE = /\.(test|spec)\.ts$/;
const PWAUTO_SPEC_FILE_RE = /\.spec\.ts$/;

function safeReadDir(p: string): string[] {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}

function listFilesRecursive(
  root: string,
  maxDepth = 4,
): string[] {
  const out: string[] = [];
  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries: string[];
    try {
      entries = safeReadDir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (
        entry === 'node_modules' ||
        entry === '.git' ||
        entry === 'dist' ||
        entry === '.astro' ||
        entry === '.bun' ||
        entry === '.cache'
      )
        continue;
      const full = join(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        walk(full, depth + 1);
      } else if (s.isFile()) {
        if (UNIT_TEST_FILE_RE.test(entry)) {
          out.push(full);
        }
      }
    }
  }
  walk(root, 0);
  return out;
}

function listPlaywrightSpecs(root: string, maxDepth = 4): string[] {
  const out: string[] = [];
  function walk(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    let entries: string[];
    try {
      entries = safeReadDir(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (
        entry === 'node_modules' ||
        entry === '.git' ||
        entry === 'dist' ||
        entry === '.astro' ||
        entry === '.bun' ||
        entry === '.cache'
      )
        continue;
      const full = join(dir, entry);
      let s;
      try {
        s = statSync(full);
      } catch {
        continue;
      }
      if (s.isDirectory()) {
        walk(full, depth + 1);
      } else if (s.isFile() && PWAUTO_SPEC_FILE_RE.test(entry)) {
        out.push(full);
      }
    }
  }
  walk(root, 0);
  return out;
}

function extractUnitAcFromFile(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8');
  const lines = source.split('\n').slice(0, 12).join('\n');
  const m = lines.match(AC_HEADER_LINE_RE);
  return m ? [m[1]] : [];
}

function extractPwautoAcFromFile(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8');
  const tokens = new Set<string>();
  let m: RegExpExecArray | null;
  PW_ANNOTATION_RE.lastIndex = 0;
  while ((m = PW_ANNOTATION_RE.exec(source))) {
    tokens.add(m[1]);
  }
  return [...tokens];
}

export function buildInventory(projectsRoot: string): Inventory {
  const criteria: Record<string, CriterionInventory> = {};

  const unitRoots: string[] = [
    join(projectsRoot, 'tests', 'back'),
    join(projectsRoot, 'backend', 'src'),
  ];
  const pwautoRoots: string[] = [
    join(projectsRoot, 'tests', 'front', 'tests'),
  ];

  const unitFiles = new Set<string>();
  for (const r of unitRoots) {
    try {
      const files = listFilesRecursive(r, 4);
      for (const f of files) unitFiles.add(f);
    } catch {}
  }

  for (const file of unitFiles) {
    const tokens = extractUnitAcFromFile(file);
    for (const t of tokens) {
      const entry =
        criteria[t] ??
        {
          hasUnitTest: false,
          hasPwautoSpec: false,
          hasPwcliEvidence: false,
          hasManualEvidence: false,
          unitTestPaths: [],
          pwautoSpecPaths: [],
        };
      entry.hasUnitTest = true;
      entry.unitTestPaths.push(relative(projectsRoot, file));
      criteria[t] = entry;
    }
  }

  const pwautoFiles = new Set<string>();
  for (const r of pwautoRoots) {
    try {
      const files = listPlaywrightSpecs(r, 4);
      for (const f of files) pwautoFiles.add(f);
    } catch {}
  }
  for (const file of pwautoFiles) {
    const tokens = extractPwautoAcFromFile(file);
    if (tokens.length === 0) continue;
    for (const t of tokens) {
      const entry =
        criteria[t] ??
        {
          hasUnitTest: false,
          hasPwautoSpec: false,
          hasPwcliEvidence: false,
          hasManualEvidence: false,
          unitTestPaths: [],
          pwautoSpecPaths: [],
        };
      entry.hasPwautoSpec = true;
      entry.pwautoSpecPaths.push(relative(projectsRoot, file));
      criteria[t] = entry;
    }
  }

  return {
    criteria,
    scannedAt: new Date().toISOString(),
    projectsRoot,
  };
}
