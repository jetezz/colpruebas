import { createHash } from 'node:crypto';
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { buildInventory, type Inventory } from './test-inventory.ts';

export type CoverageMethod = 'Unit' | 'PW-CLI' | 'PW-AUTO' | 'Manual';
export type AppMapCoverageState =
  | 'covered'
  | 'partial'
  | 'missing'
  | 'not-applicable';

export interface CriterionCoverage {
  Unit?: AppMapCoverageState;
  'PW-CLI'?: AppMapCoverageState;
  'PW-AUTO'?: AppMapCoverageState;
  Manual?: AppMapCoverageState;
}

export interface AppMapCriterion {
  id: string;
  title?: string;
  functional?: string;
  coverage?: CriterionCoverage;
  notes?: string;
}

export interface WriteResult {
  ok: boolean;
  criterionId?: string;
  method?: CoverageMethod;
  bundlePath: string;
  sha256: string;
  error?: string;
}

export interface ResetResult {
  ok: boolean;
  bundlesTouched: string[];
  criteriaReset: string[];
  failed: Array<{ criterionId: string; method: CoverageMethod; error: string }>;
}

export interface PwcliRunResult {
  ok: boolean;
  criterionId: string;
  verdict: AppMapCoverageState;
  agent: 'mock-pwcli';
  sha256: string;
  bundlePath: string;
  reason: string;
}

function sha256(buf: string): string {
  return createHash('sha256').update(buf, 'utf8').digest('hex');
}

export function defaultBundlePath(): string {
  return 'docs/app-map/views/project-workspace/features/test-tab.md';
}

export function defaultProjectsRoot(): string {
  const envRoot = process.env.PROJECTS_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  const here = dirname(fileURLToPath(import.meta.url));
  // Two levels up: backend/src → backend → project root.
  // In container, the layout may be flatter (src lives at /app/src → cwd=/app).
  // We probe both candidates and pick the one that contains `docs/`.
  const twoUp = join(here, '..', '..');
  if (existsSync(join(twoUp, 'docs', 'app-map'))) return twoUp;
  const oneUp = join(here, '..');
  if (existsSync(join(oneUp, 'docs', 'app-map'))) return oneUp;
  return process.cwd();
}

function loadBundle(bundlePath: string): {
  content: string;
  parsed: matter.GrayMatterFile<string>;
} {
  const content = readFileSync(bundlePath, 'utf8');
  const parsed = matter(content);
  return { content, parsed };
}

function dumpBundleAtomic(
  bundlePath: string,
  parsed: matter.GrayMatterFile<string>,
  original: string,
): string {
  const updated = matter.stringify(parsed.content, parsed.data);
  const originalBodyRegion = original.split('---').slice(2).join('---');
  const updatedBodyRegion = updated.split('---').slice(2).join('---');
  if (originalBodyRegion !== updatedBodyRegion) {
    throw new Error('body byte region must be preserved');
  }
  const tmp = bundlePath + '.tmp';
  writeFileSync(tmp, updated, 'utf8');
  const newSha = sha256(readFileSync(tmp, 'utf8'));
  renameSync(tmp, bundlePath);
  return newSha;
}

export function listCriteria(bundlePath = defaultBundlePath()): AppMapCriterion[] {
  const { parsed } = loadBundle(bundlePath);
  const criteria = (parsed.data as { criteria?: AppMapCriterion[] }).criteria ?? [];
  return criteria;
}

export function patchBundleCoverage(
  bundlePath: string,
  method: CoverageMethod,
  state: AppMapCoverageState,
  opts: { criterionId?: string } = {},
): WriteResult {
  try {
    const original = readFileSync(bundlePath, 'utf8');
    const preSha = sha256(original);
    const parsed = matter(original);
    const data = parsed.data as { criteria?: AppMapCriterion[] };
    if (!Array.isArray(data.criteria)) {
      return {
        ok: false,
        bundlePath,
        sha256: preSha,
        error: 'bundle has no criteria[] array',
      };
    }
    let touched = 0;
    let lastId: string | undefined;
    for (const c of data.criteria) {
      if (opts.criterionId && c.id !== opts.criterionId) continue;
      c.coverage = c.coverage ?? {};
      (c.coverage as Record<string, AppMapCoverageState>)[method] = state;
      touched++;
      lastId = c.id;
    }
    if (touched === 0) {
      return {
        ok: false,
        bundlePath,
        sha256: preSha,
        error: opts.criterionId
          ? `criterion ${opts.criterionId} not found`
          : 'no criteria updated',
      };
    }
    const postSha = dumpBundleAtomic(bundlePath, parsed, original);
    return {
      ok: true,
      criterionId: opts.criterionId ?? lastId,
      method,
      bundlePath,
      sha256: postSha,
    };
  } catch (err) {
    return {
      ok: false,
      bundlePath,
      sha256: '',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function manualMark(
  bundlePath: string,
  criterionId: string,
): WriteResult {
  if (!/^[A-Z][\w-]*$/.test(criterionId)) {
    return {
      ok: false,
      bundlePath,
      sha256: '',
      error: `invalid criterionId: ${criterionId}`,
    };
  }
  return patchBundleCoverage(bundlePath, 'Manual', 'covered', { criterionId });
}

export function resetCoverage(
  bundlePath: string,
  inventory?: Inventory,
): ResetResult {
  const inv = inventory ?? buildInventory(defaultProjectsRoot());
  const { parsed } = loadBundle(bundlePath);
  const data = parsed.data as { criteria?: AppMapCriterion[] };
  const original = readFileSync(bundlePath, 'utf8');
  if (!Array.isArray(data.criteria)) {
    return {
      ok: false,
      bundlesTouched: [],
      criteriaReset: [],
      failed: [
        { criterionId: '*', method: 'Unit', error: 'bundle has no criteria[]' },
      ],
    };
  }
  const failed: ResetResult['failed'] = [];
  const criteriaReset: string[] = [];
  const methods: CoverageMethod[] = ['Unit', 'PW-AUTO', 'PW-CLI', 'Manual'];
  for (const c of data.criteria) {
    const criterionInv =
      inv.criteria[c.id] ?? {
        hasUnitTest: false,
        hasPwautoSpec: false,
        hasPwcliEvidence: false,
        hasManualEvidence: false,
        unitTestPaths: [],
        pwautoSpecPaths: [],
      };
    c.coverage = c.coverage ?? {};
    for (const m of methods) {
      const hadCoverage =
        (c.coverage as Record<string, AppMapCoverageState>)[m] === 'covered' ||
        (c.coverage as Record<string, AppMapCoverageState>)[m] === 'partial';
      if (m === 'Unit' || m === 'PW-AUTO') {
        const hasTest =
          m === 'Unit' ? criterionInv.hasUnitTest : criterionInv.hasPwautoSpec;
        (c.coverage as Record<string, AppMapCoverageState>)[m] = hasTest
          ? hadCoverage
            ? 'missing'
            : (c.coverage as Record<string, AppMapCoverageState>)[m] ?? 'missing'
          : 'not-applicable';
      } else if (m === 'PW-CLI') {
        (c.coverage as Record<string, AppMapCoverageState>)[m] = hadCoverage
          ? 'missing'
          : (c.coverage as Record<string, AppMapCoverageState>)[m] ?? 'missing';
      } else {
        (c.coverage as Record<string, AppMapCoverageState>)[m] = hadCoverage
          ? 'missing'
          : (c.coverage as Record<string, AppMapCoverageState>)[m] ?? 'missing';
      }
    }
    criteriaReset.push(c.id);
  }
  try {
    const newSha = dumpBundleAtomic(bundlePath, parsed, original);
    return {
      ok: true,
      bundlesTouched: [bundlePath],
      criteriaReset,
      failed,
    };
  } catch (err) {
    return {
      ok: false,
      bundlesTouched: [],
      criteriaReset: [],
      failed: [
        {
          criterionId: '*',
          method: 'Unit',
          error: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

export function mockPwcliRun(
  bundlePath: string,
  criterionId: string,
  inventory?: Inventory,
): PwcliRunResult {
  const inv = inventory ?? buildInventory(defaultProjectsRoot());
  const criterionInv =
    inv.criteria[criterionId] ?? {
      hasUnitTest: false,
      hasPwautoSpec: false,
      hasPwcliEvidence: false,
      hasManualEvidence: false,
      unitTestPaths: [],
      pwautoSpecPaths: [],
    };
  const reasonParts = [
    `mock-pwcli`,
    `UnitTest=${criterionInv.hasUnitTest}`,
    `PwautoSpec=${criterionInv.hasPwautoSpec}`,
  ];
  const hasInventory =
    criterionInv.hasUnitTest || criterionInv.hasPwautoSpec;
  const verdict: AppMapCoverageState = hasInventory ? 'covered' : 'missing';
  const write = patchBundleCoverage(bundlePath, 'PW-CLI', verdict, {
    criterionId,
  });
  return {
    ok: write.ok,
    criterionId,
    verdict,
    agent: 'mock-pwcli',
    sha256: write.sha256,
    bundlePath,
    reason: reasonParts.join('; '),
  };
}
