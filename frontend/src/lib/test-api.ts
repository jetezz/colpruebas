import type { CoverageMethod } from './test-status.ts';

export interface ApiCriterion {
  id: string;
  title?: string;
  functional?: string;
  coverage?: Partial<Record<CoverageMethod, string>>;
  notes?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  error?: string;
  data?: T;
}

const DEFAULT_BASE = '/api';

function joinUrl(base: string, p: string): string {
  if (p.startsWith('/')) return base + p;
  return base + '/' + p;
}

async function jsonFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const resp = await fetch(joinUrl(DEFAULT_BASE, url), {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    const data = (await resp.json().catch(() => ({}))) as Record<string, unknown>;
    if (!resp.ok) {
      return {
        ok: false,
        error:
          typeof data.error === 'string'
            ? data.error
            : `HTTP ${resp.status}`,
      };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function fetchBundle(
  projectId: string,
  bundleRel?: string,
): Promise<
  ApiResponse<{
    projectId: string;
    bundle: string;
    criteria: ApiCriterion[];
  }>
> {
  const qs = bundleRel ? `?bundle=${encodeURIComponent(bundleRel)}` : '';
  return jsonFetch(`/projects/${projectId}/docs/app-map${qs}`);
}

export function fetchInventory(
  projectId: string,
): Promise<
  ApiResponse<{
    projectId: string;
    criteria: Record<string, ApiCriterionInventory>;
    scannedAt: string;
  }>
> {
  return jsonFetch(`/projects/${projectId}/test-inventory`);
}

export interface ApiCriterionInventory {
  hasUnitTest: boolean;
  hasPwautoSpec: boolean;
  hasPwcliEvidence: boolean;
  hasManualEvidence: boolean;
}

export interface ManualMarkResult {
  ok: boolean;
  criterionId?: string;
  method?: string;
  bundlePath?: string;
  sha256?: string;
  error?: string;
}

export function postManualMark(
  projectId: string,
  criterionId: string,
  bundlePath: string,
): Promise<ApiResponse<ManualMarkResult>> {
  return jsonFetch(`/projects/${projectId}/docs/app-map/coverage/manual`, {
    method: 'POST',
    body: JSON.stringify({ criterionId, bundlePath }),
  });
}

export interface ResetResult {
  ok: boolean;
  bundlesTouched?: string[];
  criteriaReset?: string[];
  failed?: Array<{ criterionId: string; method: string; error: string }>;
}

export function postReset(
  projectId: string,
  bundlePath: string,
): Promise<ApiResponse<ResetResult>> {
  return jsonFetch(`/projects/${projectId}/docs/app-map/coverage/reset`, {
    method: 'POST',
    body: JSON.stringify({ bundlePath }),
  });
}

export interface PwcliResult {
  ok: boolean;
  criterionId?: string;
  verdict?: string;
  agent?: string;
  sha256?: string;
  bundlePath?: string;
  reason?: string;
  prompt?: string;
  message?: string;
}

export async function postPwcli(
  projectId: string,
  criterionId: string,
  bundlePath: string,
): Promise<ApiResponse<PwcliResult>> {
  const url = `/projects/${projectId}/test-pwcli/run`;
  try {
    const resp = await fetch(joinUrl(DEFAULT_BASE, url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criterionId, bundlePath }),
    });
    const data = (await resp.json().catch(() => ({}))) as PwcliResult;
    if (resp.status === 503) {
      return {
        ok: false,
        data: { ...data, ok: false },
        error: 'agent_unavailable',
      };
    }
    if (!resp.ok) {
      return {
        ok: false,
        data,
        error:
          typeof data.error === 'string' ? data.error : `HTTP ${resp.status}`,
      };
    }
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}