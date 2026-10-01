#!/usr/bin/env bun
/**
 * scripts/task-flow-normalizer.ts
 *
 * WU-11 (`sdd-apply-code-high`, taskReadme
 * `20260722-tskflow-centralizar-flujo-tareas-sdd.md` §10) — byte-deterministic
 * normalizer that reads the `task-flow-binding` block from
 * `.agents/skills/projectctl-sdd/references/tasks/binding.md` (the canonical
 * current canonical binding) and exposes the primitives that
 * `scripts/codegen-tareas-tab.ts` uses to emit every projection.
 *
 * Design contract (D-TSKFLOW-13, REQ-TSKFLOW-011, SC-TSKFLOW-017 / -018):
 *  - The block is delimited by `<!-- task-flow-binding:start -->` /
 *    `<!-- task-flow-binding:end -->` on their own lines and contains exactly
 *    one fenced ```json``` block (D-TSKFLOW-02 / D-14).
 *  - The frame is parsed with the explicit marker policy above; any other
 *    parsing strategy is drift and aborts the normalizer.
 *  - SHA-256 is computed over the *normalized* JSON payload (sorted keys,
 *    fixed 2-space indent, LF line endings, no trailing newline) so that the
 *    digest is stable across hosts and runners.
 *  - Each emitted target carries `binding_id`, `binding_version`,
 *    `source_path`, `source_sha256` per the WU-11 contract. No target adds
 *    rules; the generator is a pure projection of the binding.
 *  - `taskflow:check` (executed via `scripts/codegen-tareas-tab.ts --check`)
 *    re-emits each target, compares byte-for-byte against the on-disk file,
 *    and exits non-zero on the first stale target (it identifies the target
 *    and the byte diff in the error message).
 *
 * Phase-gate dependencies (read-only):
 *  - WU-01: locator `.agents/sdd-workflow.json` is contract_version 2;
 *           the machine baseline scanner fail-closes on any active
 *           package/binding/model/locator/phase/overlay drift.
 *  - WU-02: the binding block exposes `binding_id`, `binding_version`,
 *           `model_version`, `task`, `artifact_store`, `status`, `phases`,
 *           `controls`, `lanes`, `gates`, `modes`, `delivery`, `active_sources`,
 *           `retired_aliases`.
 *  - WU-04: the binding is an integral `TaskFlowBindingV2`.
 *  - WU-08: binding-declared lanes are the only routing addresses; the
 *           retired monolithic aliases are forbidden in routing positions.
 *  - WU-09: the template and examples live under
 *           `.agents/skills/projectctl-sdd/assets/**` as the
 *           binding-owned projections.
 *
 * Bun-runtime only. No `npx`, no `npm install`. Pure stdlib + `node:crypto`.
 */

import {
  createHash,
} from 'node:crypto';
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import {
  relative,
  resolve,
} from 'node:path';
import {
  ProjectctlModuleResolverError,
  resolveLaneModulePath,
  resolveProjectctlModule,
} from './projectctl-module-resolver';
import { composeSelectedExtensions } from './task-flow-extension';
import { requirementsContract } from '../project/requirements-evidence';
import { criteriaIdentityContract } from '../project/criteria-change';
export { composeSelectedExtensions } from './task-flow-extension';

// Portable inline fallback for the task-skill snapshot contract
// (self-contained; no external instance contract dependency).
// Compatible with task-flow-normalizer.test.ts + orchestrator-state-machine.test.ts.
export const TASK_SKILL_SNAPSHOT_SCHEMA = 'task-skills/v1' as const;
export const TASK_SKILL_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
export interface TaskSkillSnapshotItem { readonly id: string; readonly label?: string }
export interface TaskSkillSnapshotIssue { readonly code: 'duplicate_id' | 'snapshot_parse_error'; readonly id?: string }
export interface TaskSkillSnapshotResult {
  readonly source: 'present' | 'absent' | 'invalid';
  readonly items: readonly TaskSkillSnapshotItem[];
  readonly issues: readonly TaskSkillSnapshotIssue[];
}
export function parseTaskSkillSnapshot(markdown: string): TaskSkillSnapshotResult {
  const section = markdown.match(/##\s+Task skill snapshot[\s\S]*?```json\s*([\s\S]*?)```/);
  if (!section?.[1]) return { source: 'absent', items: [], issues: [] };
  try {
    const data = JSON.parse(section[1]) as { skills?: Array<{ id?: unknown; label?: unknown }> };
    const raw = Array.isArray(data.skills) ? data.skills : null;
    if (!raw) return { source: 'invalid', items: [], issues: [] };
    const items: TaskSkillSnapshotItem[] = [];
    const issues: TaskSkillSnapshotIssue[] = [];
    const seen = new Set<string>();
    for (const entry of raw) {
      if (typeof entry.id !== 'string' || !TASK_SKILL_ID_RE.test(entry.id)) {
        return { source: 'invalid', items: [], issues: [] };
      }
      if (seen.has(entry.id)) {
        issues.push({ code: 'duplicate_id', id: entry.id });
        continue;
      }
      seen.add(entry.id);
      items.push(typeof entry.label === 'string' ? { id: entry.id, label: entry.label } : { id: entry.id });
    }
    return { source: 'present', items, issues };
  } catch {
    return { source: 'invalid', items: [], issues: [] };
  }
}

// ─── Block markers (D-TSKFLOW-02 / D-14) ───────────────────────────────

export const OPEN_MARKER = '<!-- task-flow-binding:start -->';
export const CLOSE_MARKER = '<!-- task-flow-binding:end -->';

/** Default binding path; overridable via the CLI / programmatic API. */
export const DEFAULT_BINDING_PATH =
  '.agents/skills/projectctl-sdd/references/tasks/binding.md';

/** Locator consumed by the Stage 0 machine baseline scanner. */
export const DEFAULT_LOCATOR_PATH = '.agents/sdd-workflow.json';

/** Portable package entry whose `metadata.version` is the package tuple. */
export const DEFAULT_PACKAGE_SKILL_PATH =
  '.agents/skills/projectctl-sdd/SKILL.md';

/**
 * Canonical Stage 0 machine tuple (AC-001 / REQ-ADD-001).
 * Editorial Markdown is out of scope; only locator/config/code/binding JSON.
 */
export const CANONICAL_BASELINE = Object.freeze({
  packageVersion: '24.0.0',
  bindingVersion: '14.0.0',
  contractKind: 'TaskFlowBindingV2',
  modelVersion: 2,
  locatorContractVersion: 2,
  bindingId: 'projectctl-requirements.task-flow',
  machineBlockId: 'task-flow-binding',
  phaseCount: 4,
  phaseIds: Object.freeze([
    'fase_1_propuesta',
    'fase_2_implementacion',
    'fase_3_verificacion',
    'fase_4_documentacion',
  ]),
});

/** Canonical producer of accepted gate evidence. Direct Bun/Playwright/script runs are not accepted. */
export const CANONICAL_TEST_EVIDENCE_ENTRY = 'projectctl test' as const;

export interface TestEvidenceClassification {
  readonly source: string;
  readonly accepted: boolean;
  readonly reason: string;
}

export function classifyTestEvidenceSource(source: string): TestEvidenceClassification {
  const normalized = source.trim();
  if (
    normalized === CANONICAL_TEST_EVIDENCE_ENTRY
    || normalized.startsWith(`${CANONICAL_TEST_EVIDENCE_ENTRY} `)
  ) {
    return {
      source: normalized,
      accepted: true,
      reason: 'canonical projectctl test entry',
    };
  }
  return {
    source: normalized,
    accepted: false,
    reason: 'direct Bun, Playwright, or script runs are not accepted gate evidence',
  };
}

/** Required `TaskFlowBindingV2` top-level keys (D-TSKFLOW-13 + V2 identity). */
export const REQUIRED_BINDING_KEYS = [
  'contract_kind',
  'binding_id',
  'binding_version',
  'model_version',
  'task',
  'artifact_store',
  'status',
  'phases',
  'controls',
  'lanes',
  'gates',
  'modes',
  'delivery',
  'active_sources',
  'retired_aliases',
  'requirements_verification',
  'criteria_identity',
] as const;

export type RequiredBindingKey = (typeof REQUIRED_BINDING_KEYS)[number];

export type ApplyLane = 'code-low' | 'code-medium' | 'code-high';

export interface BindingLaneEntry {
  readonly skill: string;
  readonly apply_lane?: ApplyLane;
  readonly role: string;
  readonly artifact_class: string;
  readonly owner_phase: string;
}

export interface ResolvedLaneSkillContext {
  readonly lane_skill_path: string;
  readonly surface_skill_paths: readonly string[];
  readonly task_skill_snapshot: TaskSkillSnapshotCaptureV1;
  readonly task_selected_skill_paths: readonly string[];
  readonly skill_paths: readonly string[];
}

export interface TaskSkillSnapshotWarningV1 {
  readonly id?: string;
  readonly code: 'snapshot_parse_error' | 'duplicate_id' | 'missing_skill' | 'skill_id_conflict';
}

export interface TaskSkillSnapshotCaptureV1 {
  readonly schema: 'task-skills/v1';
  readonly selected_ids: readonly string[];
  readonly warnings: readonly TaskSkillSnapshotWarningV1[];
}

export interface CapturedTaskSelectedSkillsV1 {
  readonly task_skill_snapshot: TaskSkillSnapshotCaptureV1;
  readonly task_selected_skill_paths: readonly string[];
}

export interface WorkflowModeContextEntryV1 {
  readonly selected: string;
  readonly default: string;
  readonly allowed: readonly string[];
  readonly mechanism_skill_ids: readonly string[];
  readonly pr_line_budget?: number;
}

export interface WorkflowModeContextV1 {
  readonly review: WorkflowModeContextEntryV1;
  readonly delivery: WorkflowModeContextEntryV1;
  readonly resolved_mechanism_skill_paths: {
    readonly review: readonly string[];
    readonly delivery: readonly string[];
  };
}

export interface ActiveTaskModeSelectionsV1 {
  readonly review?: string;
  readonly delivery?: string;
}

export const ENVIRONMENT_DEFERRAL_METHODS = ['Go', 'Docker', 'PW', 'Git-real'] as const;
export type EnvironmentDeferralMethod = (typeof ENVIRONMENT_DEFERRAL_METHODS)[number];

export interface NormalizedEnvironmentDeferralContextV2 {
  readonly record_owner: 'sdd-orchestrator';
  readonly recording_location: string;
  readonly pending_record_section: string;
  readonly record_status: 'pending_environment';
  readonly allowed_methods: readonly EnvironmentDeferralMethod[];
  readonly initial_methods_policy: 'exact_allowed_set_non_empty_unique';
  readonly active_methods_policy: 'non_empty_subset_after_evidence_bound_completion';
  readonly legacy_absent_record: 'preserve_existing_behavior';
  readonly invalid_record: 'fail_closed_preserve_position';
  readonly admission_gate_id: string;
  readonly document_write_gate_id: string;
  readonly close_block_gate_id: string;
}

export class ModeContextResolutionError extends Error {
  readonly code: 'mode_config_invalid' | 'mode_selection_invalid';

  constructor(code: 'mode_config_invalid' | 'mode_selection_invalid', message: string) {
    super(`${code}: ${message}`);
    this.name = 'ModeContextResolutionError';
    this.code = code;
  }
}

export class SkillResolutionError extends Error {
  readonly code = 'skill_resolution_missing' as const;

  constructor(message: string) {
    super(`skill_resolution_missing: ${message}`);
    this.name = 'SkillResolutionError';
  }
}

export const DEFAULT_SKILL_REGISTRY_PATH = '.atl/skill-registry.md';
const EMPTY_TASK_SKILL_CAPTURE: CapturedTaskSelectedSkillsV1 = Object.freeze({
  task_skill_snapshot: Object.freeze({
    schema: TASK_SKILL_SNAPSHOT_SCHEMA,
    selected_ids: Object.freeze([]),
    warnings: Object.freeze([]),
  }),
  task_selected_skill_paths: Object.freeze([]),
});

// ─── Domain types ──────────────────────────────────────────────────────

export interface ParsedBinding {
  /** Absolute path to the binding file. */
  readonly bindingPath: string;
  /** Repo-relative path (always uses POSIX separators). */
  readonly bindingRepoPath: string;
  /** Parsed `task-flow-binding` JSON. */
  readonly binding: Record<string, unknown>;
  /** SHA-256 of the canonicalised JSON payload (the digest embedded in projections). */
  readonly bindingSha256: string;
  /** Binding frontmatter (from `--- ... ---` at the top of the file). */
  readonly frontmatter: BindingFrontmatter;
  /** The raw text body of the binding file (without the delimited block). */
  readonly body: string;
}

export interface BindingFrontmatter {
  readonly version: string;
  readonly parentSkill: string;
  readonly lastFullRegen: string;
  readonly bindingId: string;
  readonly bindingVersion: string;
  readonly modelVersion: number;
}

export interface BindingSourceMetadata {
  readonly binding_id: string;
  readonly binding_version: string;
  readonly source_path: string;
  readonly source_sha256: string;
  /** Generated-at timestamp sourced from the binding frontmatter (`last_full_regen`). */
  readonly generated_at: string;
}

export interface GenerationTarget {
  /** Logical target id (used in error messages and the public manifest). */
  readonly id: string;
  /** Human-readable role of the target. */
  readonly role: string;
  /** Repo-relative path where the target is written. */
  readonly path: string;
  /** Marker that the produced content carries (banner + metadata). */
  readonly kind: 'json' | 'ts';
  /** Whether the target is *regenerated* by the codegen. */
  readonly mode: 'generated' | 'validated';
}

export interface GenerationDiff {
  readonly target: GenerationTarget;
  readonly reason: 'missing' | 'drift' | 'ok';
  readonly onDiskSha256: string | null;
  readonly expectedSha256: string | null;
}

export interface GenerationReport {
  readonly source: BindingSourceMetadata;
  readonly targets: GenerationDiff[];
  readonly validators: ReadonlyArray<{ id: string; ok: boolean; detail: string }>;
}

// ─── Canonical JSON serialiser (sorted keys, fixed indent, LF) ────────

/**
 * JSON.stringify with a sorted-key replacer so the output is byte-deterministic.
 * Arrays keep their order (it is meaningful for the binding). We use 2-space
 * indent and a trailing newline so the file is a proper POSIX text file.
 */
export function canonicalJsonStringify(value: unknown, indent: number = 2): string {
  const indentStr = ' '.repeat(indent);
  const json = JSON.stringify(
    value,
    (key, val) => {
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        const sorted: Record<string, unknown> = {};
        for (const k of Object.keys(val as Record<string, unknown>).sort()) {
          sorted[k] = (val as Record<string, unknown>)[k];
        }
        return sorted;
      }
      return val;
    },
    indentStr,
  );
  if (json === undefined) {
    throw new Error('canonicalJsonStringify: value is not JSON-serialisable');
  }
  // JSON.stringify already emits LF; we ensure a trailing newline so the
  // file ends with a newline character (POSIX text file convention).
  return json.endsWith('\n') ? json : `${json}\n`;
}

export function sha256OfString(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export interface BaselineDrift {
  readonly path: string;
  readonly key: string;
  readonly expected: string;
  readonly actual: string;
}

export interface BaselineCheckReport {
  readonly ok: boolean;
  readonly drifts: readonly BaselineDrift[];
  readonly digest: {
    readonly locatorSha256: string | null;
    readonly bindingSha256: string | null;
    readonly packageSkillSha256: string | null;
    readonly prodOverlaySha256: string | null;
    readonly devOverlaySha256: string | null;
  };
}

function readRepoText(repoRoot: string, repoPath: string): string | null {
  const absolute = resolve(repoRoot, repoPath);
  if (!existsSync(absolute)) return null;
  return readFileSync(absolute, 'utf8');
}

function parsePackageMetadataVersion(raw: string): string | null {
  const frontmatter = raw.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (!frontmatter) return null;
  const lines = frontmatter.split('\n');
  const metadataLine = lines.findIndex((line) => /^metadata:\s*$/.test(line));
  if (metadataLine < 0) return null;
  const metadataIndent = lines[metadataLine].match(/^\s*/)?.[0].length ?? 0;
  for (let index = metadataLine + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (indent <= metadataIndent) break;
    const match = line.match(/^\s+version:\s*(?:"([^"]+)"|'([^']+)'|([^#\s]+))\s*(?:#.*)?$/);
    if (!match) continue;
    return (match[1] ?? match[2] ?? match[3] ?? '').trim();
  }
  return null;
}

/**
 * Stage 0 machine baseline (AC-001). Scans locator, package
  * metadata, binding JSON, base phase registry and prod/dev overlay names.
 * Fail-closed: every divergence is reported with path + key + expected/got.
 * Editorial Markdown is intentionally out of scope.
 */
export function checkMachineBaseline(
  repoRoot: string,
  options: { readonly bindingPath?: string } = {},
): BaselineCheckReport {
  const drifts: BaselineDrift[] = [];
  const record = (path: string, key: string, expected: string, actual: string): void => {
    drifts.push({ path, key, expected, actual });
  };

  const locatorRaw = readRepoText(repoRoot, DEFAULT_LOCATOR_PATH);
  const packageRaw = readRepoText(repoRoot, DEFAULT_PACKAGE_SKILL_PATH);
  const bindingPath = options.bindingPath ?? DEFAULT_BINDING_PATH;
  const bindingRaw = readRepoText(repoRoot, bindingPath);

  if (locatorRaw === null) {
    record(DEFAULT_LOCATOR_PATH, 'file', 'readable JSON locator V2', 'missing');
  } else {
    try {
      const locator = JSON.parse(locatorRaw) as Record<string, unknown>;
      if (locator.contract_version !== CANONICAL_BASELINE.locatorContractVersion) {
        record(
          DEFAULT_LOCATOR_PATH,
          'contract_version',
          String(CANONICAL_BASELINE.locatorContractVersion),
          JSON.stringify(locator.contract_version),
        );
      }
      if (locator.machine_block_id !== CANONICAL_BASELINE.machineBlockId) {
        record(
          DEFAULT_LOCATOR_PATH,
          'machine_block_id',
          CANONICAL_BASELINE.machineBlockId,
          JSON.stringify(locator.machine_block_id),
        );
      }
      if (locator.expected_binding_id !== CANONICAL_BASELINE.bindingId) {
        record(
          DEFAULT_LOCATOR_PATH,
          'expected_binding_id',
          CANONICAL_BASELINE.bindingId,
          JSON.stringify(locator.expected_binding_id),
        );
      }
      if (locator.expected_binding_version !== CANONICAL_BASELINE.bindingVersion) {
        record(
          DEFAULT_LOCATOR_PATH,
          'expected_binding_version',
          CANONICAL_BASELINE.bindingVersion,
          JSON.stringify(locator.expected_binding_version),
        );
      }
      if (locator.binding_path !== DEFAULT_BINDING_PATH) {
        record(
          DEFAULT_LOCATOR_PATH,
          'binding_path',
          DEFAULT_BINDING_PATH,
          JSON.stringify(locator.binding_path),
        );
      }
    } catch (error) {
      record(
        DEFAULT_LOCATOR_PATH,
        'json',
        'parseable LocatorV2',
        error instanceof Error ? error.message : 'invalid JSON',
      );
    }
  }

  if (packageRaw === null) {
    record(DEFAULT_PACKAGE_SKILL_PATH, 'file', 'readable package skill', 'missing');
  } else {
    const packageVersion = parsePackageMetadataVersion(packageRaw);
    if (packageVersion !== CANONICAL_BASELINE.packageVersion) {
      record(
        DEFAULT_PACKAGE_SKILL_PATH,
        'metadata.version',
        CANONICAL_BASELINE.packageVersion,
        JSON.stringify(packageVersion),
      );
    }
  }

  if (bindingRaw === null) {
    record(bindingPath, 'file', 'readable TaskFlowBindingV2', 'missing');
  } else {
    try {
      const parsed = parseBindingFile(repoRoot, bindingPath);
      const phases = parsed.binding.phases;
      if (!Array.isArray(phases)) {
        record(bindingPath, 'phases', `${CANONICAL_BASELINE.phaseCount} phase objects`, JSON.stringify(phases));
      } else {
        const phaseIds = phases.map((phase) =>
          phase && typeof phase === 'object' && typeof (phase as { id?: unknown }).id === 'string'
            ? (phase as { id: string }).id
            : '',
        );
        if (phaseIds.length !== CANONICAL_BASELINE.phaseCount) {
          record(
            bindingPath,
            'phases.length',
            String(CANONICAL_BASELINE.phaseCount),
            String(phaseIds.length),
          );
        }
        const expectedIds = CANONICAL_BASELINE.phaseIds.join(',');
        const actualIds = phaseIds.join(',');
        if (actualIds !== expectedIds) {
          record(bindingPath, 'phases[].id', expectedIds, actualIds);
        }
      }
    } catch (error) {
      record(
        bindingPath,
        'task-flow-binding',
        `${CANONICAL_BASELINE.contractKind} ${CANONICAL_BASELINE.bindingVersion} model ${CANONICAL_BASELINE.modelVersion}`,
        error instanceof Error ? error.message : 'binding parse failed',
      );
    }
  }

  return {
    ok: drifts.length === 0,
    drifts,
    digest: {
      locatorSha256: locatorRaw === null ? null : sha256OfString(locatorRaw),
      bindingSha256: bindingRaw === null ? null : sha256OfString(bindingRaw),
      packageSkillSha256: packageRaw === null ? null : sha256OfString(packageRaw),
      prodOverlaySha256: null,
      devOverlaySha256: null,
    },
  };
}

export function assertMachineBaseline(
  repoRoot: string,
  options: { readonly bindingPath?: string } = {},
): BaselineCheckReport {
  const report = checkMachineBaseline(repoRoot, options);
  if (!report.ok) {
    const first = report.drifts[0];
    const extra = report.drifts.length > 1 ? ` (+${report.drifts.length - 1} more)` : '';
    throw new Error(
      `machine baseline drift: path=${first.path} key=${first.key} expected=${first.expected} got=${first.actual}${extra}`,
    );
  }
  return report;
}

// ─── Block extraction (marker policy + fenced JSON) ─────────────────────

/**
 * Parse the frontmatter of the binding file and return the body that follows
 * the closing `---`. The implementation is intentionally minimal: it relies
 * on the binding file always declaring a YAML frontmatter delimited by `---`
 * lines on their own line.
 */
export function parseFrontmatter(raw: string): BindingFrontmatter {
  const match = raw.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error('task-flow binding: missing YAML frontmatter');
  }
  const fm = match[1];
  const field = (key: string): string => {
    const re = new RegExp(`^${key}:\\s*(.+?)\\s*$`, 'm');
    const m = fm.match(re);
    if (!m) {
      throw new Error(`task-flow binding: frontmatter missing field "${key}"`);
    }
    return m[1].replace(/^"(.*)"$/, '$1');
  };
  const modelVersion = Number(field('model_version'));
  if (!Number.isInteger(modelVersion)) {
    throw new Error('task-flow binding: model_version must be an integer');
  }
  return {
    version: field('version'),
    parentSkill: field('parent_skill'),
    lastFullRegen: field('last_full_regen'),
    bindingId: field('binding_id'),
    bindingVersion: field('version'),
    modelVersion,
  };
}

/**
 * Strip the frontmatter from the file and return the markdown body.
 * The body keeps the delimited block intact (the codegen must read it).
 */
export function stripFrontmatter(raw: string): string {
  const normalized = raw.replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n[\s\S]*?\n---\n?/);
  if (!match) {
    return normalized;
  }
  return normalized.slice(match[0].length);
}

/**
 * Extract the unique fenced ```json``` block strictly between the two
 * markers. The block must be present exactly once. The body returned is
 * the *raw fenced JSON* (without the surrounding code fence), trimmed.
 *
 * The marker policy here is intentionally strict: any other parsing strategy
 * is drift per D-TSKFLOW-13 / D-14. The markers must be on their OWN line
 * (preceded by start-of-line and followed by end-of-line) — that prevents
 * accidental matches inside prose paragraphs that quote the marker text
 * (e.g. "Open marker: `<!-- task-flow-binding:start -->` on its own line.").
 */
export function extractBindingBlock(body: string): string {
  const lines = body.split('\n');
  let startLine = -1;
  let endLine = -1;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === OPEN_MARKER) {
      if (startLine >= 0) {
        throw new Error('task-flow binding: open marker appears more than once');
      }
      startLine = i;
    } else if (trimmed === CLOSE_MARKER) {
      if (endLine >= 0) {
        throw new Error('task-flow binding: close marker appears more than once');
      }
      endLine = i;
    }
  }
  if (startLine < 0) {
    throw new Error(`task-flow binding: open marker not found (${OPEN_MARKER})`);
  }
  if (endLine < 0) {
    throw new Error(`task-flow binding: close marker not found (${CLOSE_MARKER})`);
  }
  if (endLine <= startLine) {
    throw new Error('task-flow binding: close marker appears before open marker');
  }

  const between = lines.slice(startLine + 1, endLine).join('\n');

  const openFence = between.match(/```json\s*\n/);
  if (!openFence || openFence.index === undefined) {
    throw new Error('task-flow binding: fenced ```json code block not found inside markers');
  }
  const closeFence = between.indexOf('```', openFence.index + openFence[0].length);
  if (closeFence < 0) {
    throw new Error('task-flow binding: closing ``` fence not found inside markers');
  }
  // Second opening fence? (disallowed)
  const secondOpen = between.indexOf('```json', openFence.index + openFence[0].length);
  if (secondOpen >= 0 && secondOpen < closeFence) {
    throw new Error('task-flow binding: more than one fenced ```json block between markers');
  }

  return between.slice(openFence.index + openFence[0].length, closeFence).trim();
}

/**
 * Parse the binding file from disk and return its full structured
 * representation. The binding JSON is normalised (sorted keys, no
 * indentation in-memory) before the SHA-256 is computed so the digest
 * is invariant to the source's layout.
 */
export function parseBindingFile(repoRoot: string, bindingPath: string = DEFAULT_BINDING_PATH, selections: Readonly<Record<string, string>> = {}): ParsedBinding {
  const absolutePath = resolve(repoRoot, bindingPath);
  if (!existsSync(absolutePath)) {
    throw new Error(`task-flow binding: file not found at ${bindingPath}`);
  }
  const raw = readFileSync(absolutePath, 'utf-8');
  const frontmatter = parseFrontmatter(raw);
  const body = stripFrontmatter(raw);
  const blockRaw = extractBindingBlock(body);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(blockRaw) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `task-flow binding: failed to parse fenced JSON block (${(err as Error).message})`,
    );
  }

  assertBindingShape(parsed);
  parsed = composeSelectedExtensions(parsed, repoRoot, selections);

  if (parsed.binding_id !== frontmatter.bindingId) {
    throw new Error(
      `task-flow binding: binding_id mismatch (frontmatter "${frontmatter.bindingId}" vs block "${parsed.binding_id}")`,
    );
  }
  if (parsed.binding_version !== frontmatter.version) {
    throw new Error(
      `task-flow binding: binding_version mismatch (frontmatter "${frontmatter.version}" vs block "${parsed.binding_version}")`,
    );
  }

  const canonical = canonicalJsonStringify(parsed, 2);
  const bindingSha256 = sha256OfString(canonical);
  const repoPath = relative(repoRoot, absolutePath).split('\\').join('/');

  return {
    bindingPath: absolutePath,
    bindingRepoPath: repoPath,
    binding: parsed,
    bindingSha256,
    frontmatter,
    body,
  };
}

export function assertBindingShape(parsed: Record<string, unknown>): void {
  for (const key of REQUIRED_BINDING_KEYS) {
    if (!(key in parsed)) {
      throw new Error(
        `task-flow binding: missing required key "${key}" (TaskFlowBindingV2 shape)`,
      );
    }
  }

  if (parsed.contract_kind !== CANONICAL_BASELINE.contractKind) {
    throw new Error(
      `task-flow binding: contract_kind mismatch (path=${DEFAULT_BINDING_PATH} key=contract_kind expected="${CANONICAL_BASELINE.contractKind}" got=${JSON.stringify(parsed.contract_kind)})`,
    );
  }
  if (parsed.binding_id !== CANONICAL_BASELINE.bindingId) {
    throw new Error(
      `task-flow binding: binding_id mismatch (path=${DEFAULT_BINDING_PATH} key=binding_id expected="${CANONICAL_BASELINE.bindingId}" got=${JSON.stringify(parsed.binding_id)})`,
    );
  }
  if (parsed.binding_version !== CANONICAL_BASELINE.bindingVersion) {
    throw new Error(
      `task-flow binding: binding_version mismatch (path=${DEFAULT_BINDING_PATH} key=binding_version expected="${CANONICAL_BASELINE.bindingVersion}" got=${JSON.stringify(parsed.binding_version)})`,
    );
  }
  if (parsed.model_version !== CANONICAL_BASELINE.modelVersion) {
    throw new Error(
      `task-flow binding: model_version mismatch (path=${DEFAULT_BINDING_PATH} key=model_version expected=${CANONICAL_BASELINE.modelVersion} got=${JSON.stringify(parsed.model_version)})`,
    );
  }

  assertControlTransitionShape(parsed);
  assertLaneShape(parsed);
  requireModeDefinition(parsed.modes as Record<string, unknown> | undefined, 'review_mode');
  requireModeDefinition(parsed.modes as Record<string, unknown> | undefined, 'delivery_mode');
  normalizeEnvironmentDeferralContext(parsed);
  requirementsContract(parsed);
  const identity = criteriaIdentityContract(parsed);
  for (const [key, value] of Object.entries(identity)) {
    if (!key.endsWith('_evidence')) continue;
    const gates = parsed.gates as Record<string, { required_evidence: string[] }>;
    if (!Object.values(gates).some(g => g.required_evidence.includes(String(value)))) throw new Error(`criteria_identity evidence unused: ${key}`);
  }
}

function isExactStringSet(value: unknown, expected: readonly string[]): value is string[] {
  return Array.isArray(value) && value.length === expected.length &&
    value.every((entry): entry is string => typeof entry === 'string') &&
    new Set(value).size === value.length && expected.every((entry) => value.includes(entry));
}

/** Validate the only method set allowed to create a new deferral record. */
export function validatePendingEnvironmentMethods(methods: unknown): methods is EnvironmentDeferralMethod[] {
  return isExactStringSet(methods, ENVIRONMENT_DEFERRAL_METHODS);
}

function requireClosedString(record: Record<string, unknown>, key: string, expected: string, owner: string): void {
  if (record[key] !== expected) {
    throw new Error(`task-flow binding: ${owner}.${key} must equal "${expected}"`);
  }
}

/** Normalize bounded V2 gate configuration; never exposes a mutable task record. */
export function normalizeEnvironmentDeferralContext(binding: Record<string, unknown>): NormalizedEnvironmentDeferralContextV2 {
  const modes = binding.modes;
  const gates = binding.gates;
  if (!modes || typeof modes !== 'object' || Array.isArray(modes)) throw new Error('task-flow binding: modes must be an object');
  if (!gates || typeof gates !== 'object' || Array.isArray(gates)) throw new Error('task-flow binding: gates must be an object');

  const raw = (modes as Record<string, unknown>).environment_deferral;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('task-flow binding: TaskFlowBindingV2 requires modes.environment_deferral');
  }
  const config = raw as Record<string, unknown>;
  requireClosedString(config, 'record_owner', 'sdd-orchestrator', 'modes.environment_deferral');
  requireClosedString(config, 'record_status', 'pending_environment', 'modes.environment_deferral');
  requireClosedString(config, 'initial_methods_policy', 'exact_allowed_set_non_empty_unique', 'modes.environment_deferral');
  requireClosedString(config, 'active_methods_policy', 'non_empty_subset_after_evidence_bound_completion', 'modes.environment_deferral');
  requireClosedString(config, 'legacy_absent_record', 'preserve_existing_behavior', 'modes.environment_deferral');
  requireClosedString(config, 'invalid_record', 'fail_closed_preserve_position', 'modes.environment_deferral');
  if (!validatePendingEnvironmentMethods(config.allowed_methods)) {
    throw new Error('task-flow binding: modes.environment_deferral.allowed_methods must be the exact non-empty unique approved set');
  }
  if (typeof config.recording_location !== 'string' || config.recording_location.length === 0 ||
      typeof config.pending_record_section !== 'string' || config.pending_record_section.length === 0) {
    throw new Error('task-flow binding: environment deferral recording accessors must be non-empty strings');
  }

  const gateRegistry = gates as Record<string, unknown>;
  const requireGate = (id: string, evaluator: 'hard_gate' | 'revision_gate'): Record<string, unknown> => {
    const gate = gateRegistry[id];
    if (!gate || typeof gate !== 'object' || Array.isArray(gate)) throw new Error(`task-flow binding: environment deferral gate "${id}" is missing`);
    const value = gate as Record<string, unknown>;
    if (value.evaluator !== evaluator || !Array.isArray(value.required_evidence) || value.required_evidence.length === 0 ||
        value.required_evidence.some((entry) => typeof entry !== 'string' || entry.length === 0)) {
      throw new Error(`task-flow binding: environment deferral gate "${id}" has invalid evaluator/evidence configuration`);
    }
    return value;
  };
  const admission = requireGate('environment_verification_deferred', 'hard_gate');
  requireGate('p4_document_candidate_written', 'revision_gate');
  const closeBlock = requireGate('pending_environment_close_block', 'hard_gate');

  for (const [id, gate] of [['environment_verification_deferred', admission], ['pending_environment_close_block', closeBlock]] as const) {
    const gateConfig = gate.configuration;
    if (!gateConfig || typeof gateConfig !== 'object' || Array.isArray(gateConfig)) throw new Error(`task-flow binding: gate "${id}" requires bounded configuration`);
    const bounded = gateConfig as Record<string, unknown>;
    if (bounded.recording_location !== config.recording_location || bounded.pending_record_section !== config.pending_record_section ||
        !validatePendingEnvironmentMethods(bounded.allowed_methods)) {
      throw new Error(`task-flow binding: gate "${id}" deferral accessors do not match modes.environment_deferral`);
    }
  }

  return Object.freeze({
    record_owner: 'sdd-orchestrator', recording_location: config.recording_location,
    pending_record_section: config.pending_record_section, record_status: 'pending_environment',
    allowed_methods: Object.freeze([...ENVIRONMENT_DEFERRAL_METHODS]),
    initial_methods_policy: 'exact_allowed_set_non_empty_unique',
    active_methods_policy: 'non_empty_subset_after_evidence_bound_completion',
    legacy_absent_record: 'preserve_existing_behavior', invalid_record: 'fail_closed_preserve_position',
    admission_gate_id: 'environment_verification_deferred', document_write_gate_id: 'p4_document_candidate_written',
    close_block_gate_id: 'pending_environment_close_block',
  });
}

function assertLaneShape(binding: Record<string, unknown>): void {
  if (!binding.lanes || typeof binding.lanes !== 'object' || Array.isArray(binding.lanes)) {
    throw new Error('task-flow binding: lanes must be an object');
  }

  const allowedApplyLanes = new Set<ApplyLane>(['code-low', 'code-medium', 'code-high']);
  for (const [laneId, value] of Object.entries(binding.lanes as Record<string, unknown>)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`task-flow binding: lane "${laneId}" must be an object`);
    }
    const lane = value as Record<string, unknown>;
    if (typeof lane.skill !== 'string' || lane.skill.length === 0) {
      throw new Error(`task-flow binding: lane "${laneId}" must declare a logical skill`);
    }
    if (
      typeof lane.role !== 'string' ||
      typeof lane.artifact_class !== 'string' ||
      typeof lane.owner_phase !== 'string'
    ) {
      throw new Error(`task-flow binding: lane "${laneId}" has incomplete lane metadata`);
    }
    if (lane.apply_lane !== undefined && !allowedApplyLanes.has(lane.apply_lane as ApplyLane)) {
      throw new Error(`task-flow binding: lane "${laneId}" has invalid apply_lane "${String(lane.apply_lane)}"`);
    }
  }
}

function parseMarkdownTableRow(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let escaped = false;
  for (const char of line.trim().slice(1, -1)) {
    if (escaped) {
      cell += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

export function parseSkillRegistry(markdown: string, repoRoot?: string): ReadonlyMap<string, string> {
  const entries = new Map<string, string>();
  let tableFormat: 'canonical' | 'legacy' | undefined;

  const normalizeRegistryPath = (skillPath: string): string => {
    if (!repoRoot || !skillPath.startsWith('/')) return skillPath;

    const absolutePath = resolve(skillPath);
    const absoluteRoot = resolve(repoRoot);
    const withinRepo = absolutePath === absoluteRoot || absolutePath.startsWith(`${absoluteRoot}/`);
    if (!withinRepo) return skillPath;
    return relative(absoluteRoot, absolutePath).split('\\').join('/');
  };

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed)) {
      tableFormat = undefined;
      continue;
    }
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = parseMarkdownTableRow(trimmed);
    if (cells.length === 4 && cells[0] === 'Skill' && cells[3] === 'Path') {
      tableFormat = 'canonical';
      continue;
    }
    if (cells.length === 3 && cells[0] === 'Trigger' && cells[1] === 'Skill' && cells[2] === 'Path') {
      tableFormat = 'legacy';
      continue;
    }
    if (tableFormat && cells.every((cell) => /^-+$/.test(cell))) continue;
    if (!tableFormat) continue;

    const expectedCells = tableFormat === 'canonical' ? 4 : 3;
    if (cells.length !== expectedCells) {
      throw new SkillResolutionError(
        `registry ${tableFormat} row has ${cells.length} cells, expected ${expectedCells}`,
      );
    }
    const [rawSkill, rawSkillPath] = tableFormat === 'canonical'
      ? [cells[0], cells[3]]
      : [cells[1], cells[2]];
    const skill = rawSkill.replace(/^`|`$/g, '');
    const skillPath = normalizeRegistryPath(rawSkillPath.replace(/^`|`$/g, ''));
    if (!skill || !skillPath || skillPath === '---') continue;
    const previous = entries.get(skill);
    if (previous) {
      throw new SkillResolutionError(`logical skill "${skill}" has multiple registry paths`);
    }
    entries.set(skill, skillPath);
  }
  return entries;
}

export function assertReadableRepoSkillPath(repoRoot: string, skillPath: string, owner: string): void {
  const isSkill = skillPath.endsWith('/SKILL.md');
  const isModule = skillPath.endsWith('/module.md');
  const isProtocolSibling =
    skillPath.startsWith('.agents/skills/projectctl-sdd/modules/sd-protocol/') &&
    skillPath.endsWith('.md') &&
    !skillPath.split('/').includes('..');
  if (
    skillPath.startsWith('/') ||
    skillPath.split('/').includes('..') ||
    (!isSkill && !isModule && !isProtocolSibling)
  ) {
    throw new SkillResolutionError(`${owner} resolved to invalid repo-relative path "${skillPath}"`);
  }
  try {
    readFileSync(resolve(repoRoot, skillPath), 'utf8');
  } catch {
    throw new SkillResolutionError(`${owner} path "${skillPath}" is unreadable`);
  }
}

function parseExplicitSkillMetadataId(content: string): string | null {
  const frontmatter = content.replace(/\r\n?/g, '\n').match(/^---\n([\s\S]*?)\n---(?:\n|$)/)?.[1];
  if (!frontmatter) return null;
  const lines = frontmatter.split('\n');
  const metadataLine = lines.findIndex((line) => /^metadata:\s*$/.test(line));
  if (metadataLine < 0) return null;
  const metadataIndent = lines[metadataLine].match(/^\s*/)?.[0].length ?? 0;
  for (let index = metadataLine + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    if (indent <= metadataIndent) break;
    const match = line.match(/^\s+id:\s*(?:"([^"]+)"|'([^']+)'|([^#\s]+))\s*(?:#.*)?$/);
    if (!match) continue;
    const id = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    return TASK_SKILL_ID_RE.test(id) ? id : null;
  }
  return null;
}

function parseTaskSkillSnapshotIds(markdown: string): {
  ids: string[];
  warnings: TaskSkillSnapshotWarningV1[];
} {
  const parsed = parseTaskSkillSnapshot(markdown);
  if (parsed.source === 'absent') return { ids: [], warnings: [] };
  if (parsed.source === 'invalid') return { ids: [], warnings: [{ code: 'snapshot_parse_error' }] };
  return {
    ids: parsed.items.map((item) => item.id),
    warnings: parsed.issues
      .filter((issue) => issue.code === 'duplicate_id')
      .map((issue) => ({ id: issue.id, code: 'duplicate_id' })),
  };
}

/**
 * Establish the per-execution cut: re-open the canonical task file, resolve
 * selected logical IDs only against immediate, non-symlink project skill
 * entries, and freeze the result before WorkflowRuntimeContextV1 exists.
 */
export function captureTaskSelectedSkills(
  repoRoot: string,
  taskFile: string,
): CapturedTaskSelectedSkillsV1 {
  if (taskFile.startsWith('/') || taskFile.split('/').includes('..') || !taskFile.endsWith('.md')) {
    throw new SkillResolutionError(`canonical task file "${taskFile}" is not a valid repo-relative markdown path`);
  }
  const canonicalTaskPath = resolve(repoRoot, taskFile);
  const { ids, warnings } = parseTaskSkillSnapshotIds(readFileSync(canonicalTaskPath, 'utf8'));
  if (ids.length === 0 && warnings.length === 0) return EMPTY_TASK_SKILL_CAPTURE;

  const skillsRoot = resolve(repoRoot, '.agents/skills');
  const byId = new Map<string, string[]>();
  for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    const skillFile = resolve(skillsRoot, entry.name, 'SKILL.md');
    let stat;
    try {
      stat = lstatSync(skillFile);
    } catch {
      continue;
    }
    if (!stat.isFile() || stat.isSymbolicLink()) continue;
    const id = parseExplicitSkillMetadataId(readFileSync(skillFile, 'utf8'));
    if (!id) continue;
    const repoPath = relative(repoRoot, skillFile).split('\\').join('/');
    byId.set(id, [...(byId.get(id) ?? []), repoPath]);
  }

  const selectedPaths: Array<{ id: string; path: string }> = [];
  const resolvedWarnings = [...warnings];
  for (const id of ids) {
    const candidates = byId.get(id) ?? [];
    if (candidates.length === 0) resolvedWarnings.push({ id, code: 'missing_skill' });
    else if (candidates.length > 1) resolvedWarnings.push({ id, code: 'skill_id_conflict' });
    else selectedPaths.push({ id, path: candidates[0] });
  }
  selectedPaths.sort((left, right) => left.id.localeCompare(right.id));
  resolvedWarnings.sort((left, right) => (left.id ?? '').localeCompare(right.id ?? '') || left.code.localeCompare(right.code));

  const snapshot = Object.freeze({
    schema: TASK_SKILL_SNAPSHOT_SCHEMA,
    selected_ids: Object.freeze([...ids]),
    warnings: Object.freeze(resolvedWarnings.map((warning) => Object.freeze({ ...warning }))),
  });
  return Object.freeze({
    task_skill_snapshot: snapshot,
    task_selected_skill_paths: Object.freeze(selectedPaths.map((entry) => entry.path)),
  });
}

export function resolveLaneSkillContext(
  repoRoot: string,
  binding: Record<string, unknown>,
  laneId: string,
  options: {
    readonly registryPath?: string;
    readonly surfaceSkillPaths?: readonly string[];
    readonly helperSkillPaths?: readonly string[];
    readonly taskSkillCapture?: CapturedTaskSelectedSkillsV1;
  } = {},
): ResolvedLaneSkillContext {
  const lane = (binding.lanes as Record<string, BindingLaneEntry> | undefined)?.[laneId];
  if (!lane?.skill) {
    throw new SkillResolutionError(`lane "${laneId}" has no logical implementation skill`);
  }

  let laneSkillPath: string;
  try {
    laneSkillPath = resolveLaneModulePath(binding, laneId, { repoRoot }).modulePath;
  } catch (error) {
    if (!(error instanceof ProjectctlModuleResolverError)) throw error;
    throw new SkillResolutionError(`${error.code}: ${error.message}`);
  }
  assertReadableRepoSkillPath(repoRoot, laneSkillPath, `lane "${laneId}"`);

  const requiredSurfaces = (binding.requirements_verification as { lane: string; surface_skill_paths: string[] } | undefined);
  const surfaceSkillPaths = [...criteriaIdentityContract(binding).surface_skill_paths, ...(requiredSurfaces?.lane === laneId ? requiredSurfaces.surface_skill_paths : []), ...(options.surfaceSkillPaths ?? [])].filter((skillPath, index, paths) =>
    skillPath !== laneSkillPath && paths.indexOf(skillPath) === index);
  const taskSkillCapture = options.taskSkillCapture ?? EMPTY_TASK_SKILL_CAPTURE;
  const taskSelectedSkillPaths = Object.freeze([...taskSkillCapture.task_selected_skill_paths]);
  const skillPaths = Object.freeze([...new Set([
    laneSkillPath,
    ...surfaceSkillPaths,
    ...(options.helperSkillPaths ?? []),
    ...taskSelectedSkillPaths,
  ])]);

  for (const skillPath of surfaceSkillPaths) {
    assertReadableRepoSkillPath(repoRoot, skillPath, `required surface policy for lane "${laneId}"`);
  }
  for (const skillPath of [...(options.helperSkillPaths ?? []), ...taskSelectedSkillPaths]) {
    assertReadableRepoSkillPath(repoRoot, skillPath, `authorized helper for lane "${laneId}"`);
  }

  return {
    lane_skill_path: laneSkillPath,
    surface_skill_paths: Object.freeze(surfaceSkillPaths),
    task_skill_snapshot: taskSkillCapture.task_skill_snapshot,
    task_selected_skill_paths: taskSelectedSkillPaths,
    skill_paths: skillPaths,
  };
}

function requireModeDefinition(
  modes: Record<string, unknown> | undefined,
  key: string,
): { default: string; allowed: string[] } {
  const definition = modes?.[key];
  if (!definition || typeof definition !== 'object' || Array.isArray(definition)) {
    throw new ModeContextResolutionError('mode_config_invalid', `binding.modes.${key} must be an object`);
  }
  const { default: defaultValue, allowed } = definition as Record<string, unknown>;
  if (
    typeof defaultValue !== 'string' ||
    defaultValue.length === 0 ||
    !Array.isArray(allowed) ||
    allowed.length === 0 ||
    allowed.some((value) => typeof value !== 'string' || value.length === 0) ||
    new Set(allowed).size !== allowed.length ||
    !allowed.includes(defaultValue)
  ) {
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `binding.modes.${key} requires a non-empty allowed string set containing its default`,
    );
  }
  return { default: defaultValue, allowed: [...allowed] as string[] };
}

function selectMode(
  name: 'review' | 'delivery',
  definition: { default: string; allowed: string[] },
  explicit: string | undefined,
): string {
  const selected = explicit ?? definition.default;
  if (typeof selected !== 'string' || !definition.allowed.includes(selected)) {
    throw new ModeContextResolutionError(
      'mode_selection_invalid',
      `active task ${name} selection "${String(selected)}" is not allowed`,
    );
  }
  return selected;
}

function resolveMechanismSkillPaths(
  repoRoot: string,
  skillIds: readonly string[],
  registry: ReadonlyMap<string, string>,
  owner: string,
): string[] {
  return skillIds.map((skillId) => {
    try {
      const resolved = resolveProjectctlModule(skillId, { repoRoot });
      assertReadableRepoSkillPath(repoRoot, resolved.modulePath, `${owner} logical skill "${skillId}"`);
      return resolved.modulePath;
    } catch (error) {
      if (!(error instanceof ProjectctlModuleResolverError) || error.code !== 'lane_not_registered') {
        throw new ModeContextResolutionError(
          'mode_config_invalid',
          error instanceof Error ? error.message : `${owner} logical skill "${skillId}" is unreadable`,
        );
      }
    }
    const skillPath = registry.get(skillId);
    if (!skillPath) {
      throw new ModeContextResolutionError(
        'mode_config_invalid',
        `${owner} logical skill "${skillId}" is absent from MAP and the portable skill registry`,
      );
    }
    try {
      assertReadableRepoSkillPath(repoRoot, skillPath, `${owner} logical skill "${skillId}"`);
    } catch (error) {
      throw new ModeContextResolutionError(
        'mode_config_invalid',
        error instanceof Error ? error.message : `${owner} logical skill "${skillId}" is unreadable`,
      );
    }
    return skillPath;
  });
}

/** Build the bounded mode snapshot from validated binding data and explicit task selections. */
export function buildModeContext(
  repoRoot: string,
  binding: Record<string, unknown>,
  selections: ActiveTaskModeSelectionsV1,
  options: { readonly registryPath?: string } = {},
): WorkflowModeContextV1 {
  const modes = binding.modes as Record<string, unknown> | undefined;
  const reviewDefinition = requireModeDefinition(modes, 'review_mode');
  const deliveryDefinition = requireModeDefinition(modes, 'delivery_mode');
  const selectedReviewExtension = selections.review && (binding.extensions as Record<string, { selector: string; selected: string }> | undefined)
    ? Object.values(binding.extensions as Record<string, { selector: string; selected: string }>).some(extension => extension.selector === 'review_mode' && extension.selected === selections.review)
    : false;
  const reviewAllowed = selectedReviewExtension ? { ...reviewDefinition, allowed: [...reviewDefinition.allowed, selections.review!] } : reviewDefinition;
  const reviewSelected = selectMode('review', reviewAllowed, selections.review);
  const deliverySelected = selectMode('delivery', deliveryDefinition, selections.delivery);

  const reviewLane = (binding.lanes as Record<string, Record<string, unknown>> | undefined)?.[reviewSelected];
  const composed = selectedReviewExtension && !(binding.review_mechanisms as Record<string, unknown> | undefined)?.[reviewSelected]
    ? composeSelectedExtensions(binding, repoRoot, { review_mode: reviewSelected }) : binding;
  const satelliteReview = (composed.review_mechanisms as Record<string, {lane: {skill: string}; skill_path: string}> | undefined)?.[reviewSelected];
  if ((!reviewLane || typeof reviewLane.skill !== 'string' || reviewLane.skill.length === 0) && !satelliteReview) {
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `selected review mode "${reviewSelected}" must resolve to a binding lane logical skill`,
    );
  }
  const reviewSkillIds = [satelliteReview?.lane.skill ?? reviewLane.skill as string];
  if (satelliteReview) assertReadableRepoSkillPath(repoRoot, satelliteReview.skill_path, `selected review mechanism ${reviewSelected}`);

  const deliveryModes = (binding.delivery as Record<string, unknown> | undefined)?.delivery_modes;
  const deliveryConfig = (deliveryModes as Record<string, unknown> | undefined)?.[deliverySelected];
  if (!deliveryConfig || typeof deliveryConfig !== 'object' || Array.isArray(deliveryConfig)) {
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `selected delivery mode "${deliverySelected}" has no configuration`,
    );
  }
  const deliveryRecord = deliveryConfig as Record<string, unknown>;
  const configuredSkills = deliveryRecord.skills ?? [];
  if (
    !Array.isArray(configuredSkills) ||
    configuredSkills.some((skill) => typeof skill !== 'string' || skill.length === 0) ||
    new Set(configuredSkills).size !== configuredSkills.length
  ) {
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `selected delivery mode "${deliverySelected}" has invalid logical skills`,
    );
  }
  if (
    deliveryRecord.pr_line_budget !== undefined &&
    (!Number.isInteger(deliveryRecord.pr_line_budget) || (deliveryRecord.pr_line_budget as number) <= 0)
  ) {
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `selected delivery mode "${deliverySelected}" has invalid pr_line_budget`,
    );
  }
  const deliverySkillIds = [...configuredSkills] as string[];

  let registry: ReadonlyMap<string, string>;
  const registryPath = options.registryPath ?? DEFAULT_SKILL_REGISTRY_PATH;
  try {
    registry = parseSkillRegistry(readFileSync(resolve(repoRoot, registryPath), 'utf8'), repoRoot);
  } catch (error) {
    if (error instanceof ModeContextResolutionError) throw error;
    throw new ModeContextResolutionError(
      'mode_config_invalid',
      `portable skill registry "${registryPath}" is unreadable or invalid`,
    );
  }

  const context: WorkflowModeContextV1 = {
    review: {
      selected: reviewSelected,
      default: reviewDefinition.default,
       allowed: Object.freeze(reviewAllowed.allowed),
      mechanism_skill_ids: Object.freeze(reviewSkillIds),
    },
    delivery: {
      selected: deliverySelected,
      default: deliveryDefinition.default,
      allowed: Object.freeze(deliveryDefinition.allowed),
      mechanism_skill_ids: Object.freeze(deliverySkillIds),
      ...(deliveryRecord.pr_line_budget === undefined
        ? {}
        : { pr_line_budget: deliveryRecord.pr_line_budget as number }),
    },
    resolved_mechanism_skill_paths: {
      review: Object.freeze(satelliteReview
        ? [satelliteReview.skill_path]
        : resolveMechanismSkillPaths(repoRoot, reviewSkillIds, registry, 'review mode')),
      delivery: Object.freeze(resolveMechanismSkillPaths(repoRoot, deliverySkillIds, registry, 'delivery mode')),
    },
  };

  Object.freeze(context.review);
  Object.freeze(context.delivery);
  Object.freeze(context.resolved_mechanism_skill_paths);
  return Object.freeze(context);
}

export function buildSourceMetadata(parsed: ParsedBinding): BindingSourceMetadata {
  return {
    binding_id: parsed.binding.binding_id as string,
    binding_version: parsed.binding.binding_version as string,
    source_path: parsed.bindingRepoPath,
    source_sha256: parsed.bindingSha256,
    generated_at: parsed.frontmatter.lastFullRegen,
  };
}

/**
 * Validate the named control-transition contract before any projection is
 * emitted. Control transitions are the only binding mechanism that can move
 * from an action control into a phase-local state, so the generator fails
 * closed on missing identity, source mismatch, unknown targets, duplicate
 * names, or unknown guards instead of emitting an ambiguous projection.
 */
function assertControlTransitionShape(binding: Record<string, unknown>): void {
  if (!Array.isArray(binding.controls) || !Array.isArray(binding.phases) || !binding.gates || typeof binding.gates !== 'object') {
    throw new Error(
      'task-flow binding: controls, phases, and gates are required to validate control transitions',
    );
  }

  const controls = binding.controls as Array<Record<string, unknown>>;
  const controlIds = new Set<string>();
  const targets = new Set<string>();

  for (const phase of binding.phases as Array<Record<string, unknown>>) {
    if (typeof phase.id !== 'string' || !Array.isArray(phase.states)) {
      throw new Error('task-flow binding: every phase must declare an id and states[]');
    }
    for (const state of phase.states) {
      if (typeof state !== 'string') {
        throw new Error(`task-flow binding: phase "${phase.id}" contains a non-string state`);
      }
      targets.add(state);
    }
  }

  for (const control of controls) {
    if (typeof control.id !== 'string' || !Array.isArray(control.transitions)) {
      throw new Error('task-flow binding: every control must declare an id and transitions[]');
    }
    if (controlIds.has(control.id)) {
      throw new Error(`task-flow binding: duplicate control id "${control.id}"`);
    }
    controlIds.add(control.id);
    targets.add(control.id);
  }

  const transitionIds = new Set<string>();
  const gates = binding.gates as Record<string, unknown>;
  for (const control of controls) {
    for (const transition of control.transitions as Array<Record<string, unknown>>) {
      if (
        !transition ||
        typeof transition.id !== 'string' ||
        typeof transition.from !== 'string' ||
        typeof transition.to !== 'string'
      ) {
        throw new Error(
          `task-flow binding: control "${control.id}" has an unnamed or malformed transition`,
        );
      }
      if (transition.from !== control.id) {
        throw new Error(
          `task-flow binding: transition "${transition.id}" declares from="${transition.from}" but is nested under control "${control.id}"`,
        );
      }
      if (transitionIds.has(transition.id)) {
        throw new Error(`task-flow binding: duplicate control transition id "${transition.id}"`);
      }
      transitionIds.add(transition.id);
      if (!targets.has(transition.to)) {
        throw new Error(
          `task-flow binding: transition "${transition.id}" targets undeclared state/control "${transition.to}"`,
        );
      }
      if (transition.guard !== undefined && (typeof transition.guard !== 'string' || !Object.prototype.hasOwnProperty.call(gates, transition.guard))) {
        throw new Error(
          `task-flow binding: transition "${transition.id}" references unknown guard "${String(transition.guard)}"`,
        );
      }
    }
  }
}

// ─── Generators for the projections ────────────────────────────────────

/**
 * Generate the `phase-state-schema.json` projection. The canonical binding does
 * NOT carry a `state_model` helper block — the state model is rebuilt from
 * the binding's `status`, `phases`, `controls`, `lanes` and `gates` keys
 * (the same source the legacy partial schema used). The projection adds
 * the `source` identity metadata and the `artifact_role: "generated"`
 * marker; no rules are added.
 *
  * Schema (consumed by the sdd-orchestrator resolver and the anti-drift
 * suite):
 *   {
 *     "artifact_role": "generated",
 *     "source": {...binding_id, binding_version, source_path, source_sha256, generated_at},
 *     "model_version": 1,
 *     "state_model": {
 *       "status": { writable: [...], pre_bootstrap: string, terminal: string },
 *       "lanes": [lane_id, ...],                       // sorted; superset of binding.lanes
 *       "phases": [
 *         { id, status, states, allowed_lanes, transitions }
 *       ],
 *       "controls": [{ id, kind, writes_state, value?, status?, preserves?, owner, transitions }],
 *       "guards": {                                    // ← record view of binding.gates
 *         "<gate_id>": { type, requires, failure }
 *       }
 *     }
 *   }
 */
export function generatePhaseStateSchema(parsed: ParsedBinding): string {
  const binding = parsed.binding;
  const status = binding.status as { writable: string[]; pre_bootstrap: string; terminal: string };
  const phases = binding.phases as Array<Record<string, unknown>>;
  const controls = binding.controls as Array<Record<string, unknown>>;
  const lanes = binding.lanes as Record<string, BindingLaneEntry>;
  const gates = binding.gates as Record<string, { evaluator: string; required_evidence: string[]; failure: string }>;

  const lanesArray = Object.keys(lanes).sort();

  const controlProjection = controls.map((control) => {
    const out: Record<string, unknown> = {
      id: control.id,
      kind: control.kind,
      writes_state: control.writes_state,
      owner: control.owner,
      transitions: control.transitions,
    };
    if ('value' in control) {
      out.value = control.value;
    }
    if ('status' in control) {
      out.status = control.status;
    }
    if ('preserves' in control) {
      out.preserves = control.preserves;
    }
    return out;
  });

  const guards: Record<string, { type: string; requires: string[]; failure: string }> = {};
  for (const gateId of Object.keys(gates).sort()) {
    const gate = gates[gateId];
    guards[gateId] = {
      type: gate.evaluator,
      requires: gate.required_evidence,
      failure: gate.failure,
    };
  }

  const phaseProjection = phases.map((phase) => ({
    id: phase.id,
    status: phase.status,
    states: phase.states,
    allowed_lanes: phase.allowed_lanes,
    transitions: phase.transitions,
  }));

  const projection = {
    artifact_role: 'generated',
    contract_kind: binding.contract_kind,
    source: buildSourceMetadata(parsed),
    model_version: parsed.binding.model_version,
    modes: binding.modes,
    artifacts: binding.artifact_store,
    requirements_verification: binding.requirements_verification,
    state_model: {
      status: {
        writable: status.writable,
        pre_bootstrap: status.pre_bootstrap,
        terminal: status.terminal,
      },
      lanes: lanesArray,
      phases: phaseProjection,
      controls: controlProjection,
      guards,
    },
  };

  return canonicalJsonStringify(projection, 2);
}

/**
 * Generate `task-flow.generated.ts` — a typed, frozen, read-only TS module
 * that exposes the binding's structure. The module is consumed by anything
 * that needs to consult the canonical binding shape directly (e.g. future WU-13
  * anti-drift tests, the `sdd-agents.ts` validator, the sdd-orchestrator
 * resolver).
 */
export function generateTaskFlowTs(parsed: ParsedBinding): string {
  const binding = parsed.binding;
  const source = buildSourceMetadata(parsed);
  const sourceJson = canonicalJsonStringify(source, 2);
  const bindingJson = canonicalJsonStringify(binding, 2);

  const lines: string[] = [];
  lines.push(
    '/**',
    ' * task-flow.generated.ts',
    ' *',
    ' * ─── GENERATED FILE — DO NOT EDIT BY HAND ─────────────────────────',
    ' *',
    ' * Source of truth: .agents/skills/projectctl-sdd/references/tasks/binding.md',
    ` * Binding: ${source.binding_id} v${source.binding_version} (model_version ${binding.model_version}).`,
    ` * Source SHA-256: ${source.source_sha256}.`,
    ` * Generated at: ${source.generated_at} (last_full_regen from binding frontmatter).`,
    ' *',
    ' * Regenerate with: bun run taskflow:generate',
    ' * Validate with:   bun run taskflow:check',
    ' *',
    ' * This module is a byte-deterministic projection of the binding block.',
    ' * It never adds rules; it only materialises the binding for type-safe',
    ' * consumption by sdd-orchestrator, the resolver, and the anti-drift suite.',
    ' */',
    '',
  );
  lines.push(
    '/* eslint-disable */',
    '// @ts-nocheck — generated; tsc is exercised by the anti-drift suite, not by the runtime.',
    '',
  );

  // Binding source metadata — exported as a frozen object so consumers can
  // read the identity without parsing the JSON literal themselves.
  lines.push(
    'export const BINDING_SOURCE = Object.freeze(',
    sourceJson.replace(/\n/g, '\n').replace(/^/gm, '  ').replace(/^  /, ''),
    ');',
    '',
    `export const BINDING_ID = ${JSON.stringify(source.binding_id)} as const;`,
    `export const BINDING_VERSION = ${JSON.stringify(source.binding_version)} as const;`,
    `export const BINDING_MODEL_VERSION = ${JSON.stringify(binding.model_version)} as const;`,
    `export const BINDING_CONTRACT_KIND = ${JSON.stringify(binding.contract_kind)} as const;`,
    `export const SOURCE_PATH = ${JSON.stringify(source.source_path)} as const;`,
    `export const SOURCE_SHA256 = ${JSON.stringify(source.source_sha256)} as const;`,
    `export const GENERATED_AT = ${JSON.stringify(source.generated_at)} as const;`,
    '',
  );

  // Task / naming registry.
  const task = binding.task as Record<string, unknown>;
  lines.push(
    'export const TASK_FLOW_TASK = Object.freeze(',
    canonicalJsonStringify(task, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '  ' + l))
      .join('\n'),
    ');',
    '',
  );

  // Artifact store + status.
  lines.push(
    'export const TASK_FLOW_ARTIFACT_STORE = Object.freeze(',
    canonicalJsonStringify(binding.artifact_store, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '  ' + l))
      .join('\n'),
    ');',
    '',
    'export const TASK_FLOW_STATUS = Object.freeze(',
    canonicalJsonStringify(binding.status, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '  ' + l))
      .join('\n'),
    ');',
    '',
  );

  // Phases, controls, lanes, gates, delivery, active_sources, retired_aliases.
  const blocks: Array<[string, unknown]> = [
    ['TASK_FLOW_MODES', binding.modes],
    ['TASK_FLOW_PHASES', binding.phases],
    ['TASK_FLOW_CONTROLS', binding.controls],
    ['TASK_FLOW_LANES', binding.lanes],
    ['TASK_FLOW_GATES', binding.gates],
    ['TASK_FLOW_DELIVERY', binding.delivery],
    ['TASK_FLOW_ACTIVE_SOURCES', binding.active_sources],
    ['TASK_FLOW_RETIRED_ALIASES', binding.retired_aliases],
    ['TASK_FLOW_DOCUMENT_COMPATIBILITY', binding.task_document_compatibility ?? null],
  ];
  for (const [name, value] of blocks) {
    lines.push(
      `export const ${name} = Object.freeze(`,
      canonicalJsonStringify(value, 2)
        .split('\n')
        .map((l, i) => (i === 0 ? l : '  ' + l))
        .join('\n'),
      ');',
      '',
    );
  }

  // Convenience: array of lane ids, in the binding's Record order.
  const lanes = binding.lanes as Record<string, unknown>;
  const laneIds = Object.keys(lanes).sort();
  lines.push(
    'export const TASK_FLOW_LANE_IDS = Object.freeze(',
    canonicalJsonStringify(laneIds, 2),
    ');',
    '',
  );

  // Convenience: writable status union + literals.
  const status = binding.status as { writable: string[]; pre_bootstrap: string; terminal: string };
  lines.push(
    'export const TASK_FLOW_WRITABLE_STATUS = Object.freeze(',
    canonicalJsonStringify(status.writable, 2),
    ');',
    `export const TASK_FLOW_PRE_BOOTSTRAP_STATUS = ${JSON.stringify(status.pre_bootstrap)} as const;`,
    `export const TASK_FLOW_TERMINAL_STATUS = ${JSON.stringify(status.terminal)} as const;`,
    '',
  );

  // Convenience: phase ids.
  const phases = binding.phases as Array<{ id: string }>;
  const phaseIds = phases.map((p) => p.id);
  lines.push(
    'export const TASK_FLOW_PHASE_IDS = Object.freeze(',
    canonicalJsonStringify(phaseIds, 2),
    ');',
    '',
  );

  // Verifier: returns `true` if every required key is present and the
  // digest matches the binding. The validator is intentionally pure-data.
  lines.push(
    '/**',
    ' * Purity check: returns `true` iff the bundled source identity matches',
    ' * the binding file parsed at runtime. The runtime contract is defined in',
    ' * `.agents/skills/projectctl-sdd/modules/sd-protocol/workflow-runtime-context.md`.',
    ' */',
    'export function bindingSourceMatches(source: {',
    '  binding_id: string;',
    '  binding_version: string;',
    '  source_path: string;',
    '  source_sha256: string;',
    '}): boolean {',
    '  return (',
    '    source.binding_id === BINDING_ID &&',
    '    source.binding_version === BINDING_VERSION &&',
    '    source.source_path === SOURCE_PATH &&',
    '    source.source_sha256 === SOURCE_SHA256',
    '  );',
    '}',
    '',
  );

  // Bundle the raw binding JSON for diagnostics (the snapshot is exact).
  void bindingJson; // referenced for parity; bundled only as a consistency check.
  lines.push(
    '// Full binding payload (sorted-keys canonical JSON, sha256 = SOURCE_SHA256).',
    '// Useful for offline diagnostics; not consumed by the runtime.',
    'export const TASK_FLOW_BINDING_CANONICAL: string = ' +
      JSON.stringify(canonicalJsonStringify(binding, 2)) +
      ';',
    '',
  );

  return lines.join('\n');
}

// ─── F-05R editorial derivation (binding-only, no local catalog) ───────

/**
 * F-05R remediation minimum: this normalizer no longer carries ANY local
 * editorial catalog (`STATE_LABELS`, `CONTROL_LABELS`, `PHASE_TITLES`,
 * `PHASE_GOALS`, `PHASE_ENTRIES`, `PHASE_EXIT_GATES`, `PHASE_ERROR_LOOPS`,
 * `REQUIRED_INPUT_CONTRACTS`, `OPTIONAL_INPUT_CONTRACTS`). Those
 * catalogues used to materialise local policy into the view-model and
 * were the root cause of the F-05R finding.
 *
 * New contract (derivation-only, fail-closed for machine values, no
 * editorial defaults):
 *   - Machine values (state ids, lane ids, phase ids, transition
 *     guards, controls, gates, statuses, criteria coverage) are derived
 *     strictly from the binding. Missing required arrays/fields cause
 *     the codegen to fail closed.
 *   - Editorial labels (phase title / goal / entry[] / exitGate /
 *     errorLoop, state label / description, control description) come
 *     from `binding.editorial` when the binding declares them; when
 *     the binding omits them, the codegen emits the empty string and
 *     the panel renders an empty state. The codegen never falls back
 *     to a local catalogue.
 *   - The hard-coded `surfaces` array, `intro` text, `hardRemoval`
 *     text, and `operationalReferences` array have all been removed.
 *     Their values now derive from `binding.editorial.surfaces[]`,
 *     `binding.editorial.intro`, `binding.editorial.hard_removal`,
 *     and `binding.editorial.operational_references[]` respectively.
 *     When the binding omits them, the view-model emits empty /
 *     zero-length arrays and the panel renders an empty state.
 *   - The dual-direction `assertPhaseEditorialAlign`,
 *     `assertStateLabelsAlign`, `assertControlLabelsAlign`, and
 *     `assertTaskInputsAlign` validation functions are removed because
 *     the catalogs they validated against no longer exist. Editorial
 *     drift now surfaces at the binding level: a binding that gains a
 *     phase / state / control but no longer declares its editorial
 *     label will simply render the label as empty string in the
 *     view-model (no codegen failure, no local fallback text).
 */

interface PhaseEditorial {
  readonly title?: string;
  readonly goal?: string;
  readonly entry?: readonly string[];
  readonly exit_gate?: string;
  readonly error_loop?: string;
  readonly states?: Readonly<Record<string, { readonly label?: string; readonly description?: string }>>;
}

interface EditorialBlock {
  readonly intro?: { readonly title?: string; readonly description?: string };
  readonly phases?: Readonly<Record<string, PhaseEditorial>>;
  readonly controls?: Readonly<Record<string, {   readonly phase?: string;
 readonly description?: string }>>;
  readonly required_input_contracts?: Readonly<Record<string, string>>;
  readonly optional_input_contracts?: Readonly<Record<string, string>>;
  readonly surfaces?: ReadonlyArray<{
    readonly id: string;
    readonly path: string;
    readonly kind: string;
    readonly responsibilities: readonly string[];
    readonly forbidden?: readonly string[];
  }>;
  readonly hard_removal?: { readonly rule?: string; readonly stale_precedence?: string };
  readonly operational_references?: ReadonlyArray<{
    readonly label: string;
    readonly path: string;
    readonly role: string;
  }>;
}

function readEditorial(binding: Record<string, unknown>): EditorialBlock | null {
  const editorial = binding.editorial;
  if (!editorial || typeof editorial !== 'object' || Array.isArray(editorial)) return null;
  return editorial as EditorialBlock;
}

function derivePhaseTitle(editorial: EditorialBlock | null, phaseId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.title;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function derivePhaseGoal(editorial: EditorialBlock | null, phaseId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.goal;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function derivePhaseEntry(editorial: EditorialBlock | null, phaseId: string): readonly string[] {
  const fromEditorial = editorial?.phases?.[phaseId]?.entry;
  if (Array.isArray(fromEditorial)) {
    return fromEditorial.filter((s): s is string => typeof s === 'string');
  }
  return [];
}

function derivePhaseExitGate(editorial: EditorialBlock | null, phaseId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.exit_gate;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function derivePhaseErrorLoop(editorial: EditorialBlock | null, phaseId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.error_loop;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function deriveStateLabel(editorial: EditorialBlock | null, phaseId: string, stateId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.states?.[stateId]?.label;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function deriveStateDescription(editorial: EditorialBlock | null, phaseId: string, stateId: string): string {
  const fromEditorial = editorial?.phases?.[phaseId]?.states?.[stateId]?.description;
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function deriveControlEditorial(
  editorial: EditorialBlock | null,
  controlId: string,
): { phase?: string; description: string } {
  const fromEditorial = editorial?.controls?.[controlId];
  if (fromEditorial) {
    return {
      phase: typeof fromEditorial.phase === 'string' ? fromEditorial.phase : undefined,
      description: typeof fromEditorial.description === 'string' ? fromEditorial.description : '',
    };
  }
  return { phase: undefined, description: '' };
}

function deriveRequiredInputContract(editorial: EditorialBlock | null, key: string): string {
  const fromEditorial = editorial?.required_input_contracts?.[key];
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

function deriveOptionalInputContract(editorial: EditorialBlock | null, key: string): string {
  const fromEditorial = editorial?.optional_input_contracts?.[key];
  if (typeof fromEditorial === 'string') return fromEditorial;
  return '';
}

/**
 * Compute the prohibited agent list for a phase by taking the union of all
 * `binding.lanes` and subtracting the phase's `allowed_lanes`. The result is
 * deterministic because the binding's `lanes` Record is sorted and we
 * re-sort the subtraction.
 */
function computeProhibitedLanes(phaseId: string, allowedLanes: readonly string[], allLaneIds: readonly string[]): readonly string[] {
  void phaseId;
  const allowed = new Set(allowedLanes);
  return allLaneIds.filter((id) => !allowed.has(id)).sort();
}

// ─── F-05R semantic selectors (no positional derivation) ───────────────

/**
 * Derive the workflow entry position by inspecting the binding's declared
 * transition graph (phases[].transitions[] + controls[].transitions[]).
 *
 * The entry state is the unique state declared in `phases[i].states[]` that
 * has no incoming `to` reference from any transition (phase-local or
 * control-driven). The entry phase is the phase that owns that state.
 *
 * This selector is purely relational — it uses binding-declared IDs and
 * relationships, never the position of an entry in an array. If the binding
 * declares zero or multiple entry candidates, the codegen fails closed
 * (a single unambiguous entry is required to materialise `initialPhase`
 * and `initialState`).
 */
function findEntryPhaseAndState(binding: Record<string, unknown>): { phaseId: string; stateId: string } {
  const phases = binding.phases as Array<{
    id: string;
    states: string[];
    transitions?: Array<{ from: string; to: string }>;
  }>;
  const controls = binding.controls as Array<{
    id: string;
    transitions?: Array<{ from: string; to: string }>;
  }>;

  // Collect every `to` reference across the full transition graph. Both
  // phase-local transitions and action-control transitions contribute. A
  // state that appears as a `to` anywhere has an incoming edge and cannot
  // be the workflow entry.
  const incoming = new Set<string>();
  for (const phase of phases) {
    for (const t of phase.transitions ?? []) {
      if (typeof t?.to === 'string') incoming.add(t.to);
    }
  }
  for (const control of controls) {
    for (const t of control.transitions ?? []) {
      if (typeof t?.to === 'string') incoming.add(t.to);
    }
  }

  // Entry candidates: states declared by any phase that no transition
  // targets. Restrict to `phases[i].states[]` so control ids (which appear
  // as `to` values too) are not mistaken for entry points.
  const entryCandidates: { phaseId: string; stateId: string }[] = [];
  for (const phase of phases) {
    if (!Array.isArray(phase.states)) continue;
    for (const stateId of phase.states) {
      if (typeof stateId !== 'string') continue;
      if (!incoming.has(stateId)) {
        entryCandidates.push({ phaseId: phase.id, stateId });
      }
    }
  }

  if (entryCandidates.length === 0) {
    throw new Error(
      'task-flow normalizer: binding declares no entry state — every state has at least one ' +
        'incoming transition. Update the binding so exactly one phase/state pair has no ' +
        'incoming `to` reference, or fix the transition graph so the workflow has a unique ' +
        'entry point.',
    );
  }
  if (entryCandidates.length > 1) {
    const list = entryCandidates
      .map((c) => `${c.phaseId}.${c.stateId}`)
      .sort()
      .join(', ');
    throw new Error(
      `task-flow normalizer: binding declares ${entryCandidates.length} entry candidates ` +
        `without incoming transitions: [${list}]. The codegen cannot derive a unique ` +
        'workflow entry. Resolve this in the binding so exactly one phase/state pair has no ' +
        'incoming `to`.',
    );
  }
  return entryCandidates[0]!;
}

/**
 * Select the required-mirror collection by inspecting each mirror's
 * `required === true` flag (semantic, never positional).
 *
 *  - When exactly one required mirror exists, the codegen uses it for
 *    `persistence.mode` and `persistence.mirrorKeyPatterns` exactly
 *    as the binding declares.
 *  - When multiple required mirrors exist (the contract allows it), the
 *    codegen derives the FULL collection and surfaces every adapter /
 *    key pattern in deterministic order (sorted by adapter name) instead
 *    of picking any single one. `persistence.mirrorKeyPatterns`
 *    joins the patterns with `, ` so the public VM shape stays a string.
 *  - When zero required mirrors exist and the binding pins
 *    `on_required_mirror_failure: "block"`, the codegen fails closed:
 *    that contract requires at least one required mirror to enforce
 *    blocking on unavailability. The error names the exact policy
 *    pin so the binding owner can either add a required mirror or
 *    relax the policy.
 *  - When zero required mirrors exist and the binding does NOT pin
 *    `block` (i.e. `degrade`, `no-block`, undefined, or any other
 *    non-`block` value), the codegen emits the empty collection with
 *    no positional access and no local default. The persistence block
 *    downstream then derives a neutral `'<primary> primary (no
 *    required mirror)'` and `mirrorKeyPatterns: ''`; the panel
 *    renders the empty state.
 *
 * F-05R: this helper is the SOLE authority on the policy decision.
 * Callers MUST NOT reject an empty `mirrors[]` or `required` collection
 * upstream; the contract requires this branch to be reachable so
 * alternative bindings (with non-blocking mirror policies) can opt out
 * of required mirrors without breaking codegen.
 */
function selectRequiredMirrors(
  mirrors: Array<{ adapter: string; required: boolean; key_pattern: string }>,
  onRequiredMirrorFailure: string | undefined,
): readonly { adapter: string; required: boolean; key_pattern: string }[] {
  const required = mirrors.filter((m) => m && m.required === true);
  if (required.length === 0 && onRequiredMirrorFailure === 'block') {
    throw new Error(
      'task-flow normalizer: binding pins `on_required_mirror_failure: "block"` but ' +
        '`artifact_store.mirrors[]` declares no required mirror. The blocking contract ' +
        'requires at least one mirror with `required: true`. Update the binding or relax ' +
        '`on_required_mirror_failure`.',
    );
  }
  return required.slice().sort((a, b) => a.adapter.localeCompare(b.adapter));
}

/**
 * Validate that the binding's `task.criteria_coverage` (when present)
 * is a structurally sound coverage declaration. F-05 rerun: the
 * `expectedAcCount` / `expectedPctBase` literals are NOT hardcoded
 * universal rules — they used to live in the codegen and would mask
 * binding drift. The codegen now treats the binding's
 * `task.criteria_coverage` block as authoritative: if the binding
 * declares an AC/PCT mapping, the codegen exposes it verbatim; if the
 * binding omits the block, the codegen emits an empty `pctTraceability`
 * / `criteriaCovered` payload and the panel renders the empty state
 * (the universal rules from the binding remain the only authority).
 *
 * The validation here only checks SHAPE (the block must be an object
 * with valid numeric/string fields when present). Drift on the
 * individual AC/PCT rows is the consumer's responsibility — the
 * codegen never invents a mapping that is not in the binding.
 */
function assertCriteriaCoverageAlign(binding: Record<string, unknown>): void {
  const task = binding.task as { criteria_coverage?: unknown };
  if (task.criteria_coverage === undefined) {
    return;
  }
  if (!task.criteria_coverage || typeof task.criteria_coverage !== 'object') {
    throw new Error(
      'task-flow normalizer: binding declares task.criteria_coverage but the value is not ' +
        'a JSON object. Fix the binding so task.criteria_coverage is either absent or a structured ' +
        'object { ac_count?: number; pct_base?: number; rows?: Array<{ac,pct,binding_area}> }.',
    );
  }
  const coverage = task.criteria_coverage as {
    ac_count?: unknown;
    pct_base?: unknown;
    rows?: unknown;
  };
  if (coverage.ac_count !== undefined && typeof coverage.ac_count !== 'number') {
    throw new Error(
      'task-flow normalizer: binding task.criteria_coverage.ac_count must be a number when present.',
    );
  }
  if (coverage.pct_base !== undefined && typeof coverage.pct_base !== 'number') {
    throw new Error(
      'task-flow normalizer: binding task.criteria_coverage.pct_base must be a number when present.',
    );
  }
  if (coverage.rows !== undefined) {
    if (!Array.isArray(coverage.rows)) {
      throw new Error(
        'task-flow normalizer: binding task.criteria_coverage.rows must be an array of ' +
          '{ac, pct, binding_area} records when present.',
      );
    }
    for (const row of coverage.rows) {
      if (!row || typeof row !== 'object') {
        throw new Error(
          'task-flow normalizer: each task.criteria_coverage.rows entry must be an object.',
        );
      }
      const r = row as Record<string, unknown>;
      if (typeof r.ac !== 'string' || typeof r.pct !== 'string' || typeof r.binding_area !== 'string') {
        throw new Error(
          'task-flow normalizer: each task.criteria_coverage.rows entry must declare ' +
            '`ac: string`, `pct: string`, `binding_area: string`.',
        );
      }
    }
  }
}

/**
 * Generate `tareas-tab.view-model.ts` — the typed snapshot the `TareasTabPanel`
 * component imports. The shape is preserved from the legacy file (the panel
 * depends on it). All values are derived strictly from the canonical binding block;
 * editorial labels come from `binding.editorial` when the binding declares
 * them, otherwise the codegen emits empty strings / empty arrays and the
 * panel renders the empty state (no local fallback catalogue).
 */
export function generateTareasTabViewModel(parsed: ParsedBinding): string {
  const binding = parsed.binding;
  const source = buildSourceMetadata(parsed);
  const fm = parsed.frontmatter;

  assertCriteriaCoverageAlign(binding);

  const task = binding.task as Record<string, unknown>;
  const artifactStore = binding.artifact_store as Record<string, unknown>;
  const status = binding.status as Record<string, unknown>;
  const phases = binding.phases as Array<{
    id: string;
    status: string;
    states: string[];
    allowed_lanes: string[];
  }>;
  const controls = binding.controls as Array<{
    id: string;
    kind: string;
    transitions: Array<{
      id: string;
      from: string;
      to: string;
      guard?: string;
    }>;
  }>;
  const lanes = binding.lanes as Record<string, unknown>;
  const allLaneIds = Object.keys(lanes).sort();

  // F-05R: editorial block is the only source for editorial labels. The
  // block is OPTIONAL — when the binding omits it, the codegen emits
  // empty strings / arrays. Machine values (input keys, status ids, lane
  // ids, phase ids, control ids, criteria_coverage) still come from the
  // binding's machine-value blocks.
  const editorial = readEditorial(binding);

  // Required inputs — derived from `task.required_inputs`. The input keys
  // are machine values owned by the binding (the binding can never have a
  // key that is not in `task.required_inputs` when the list is present).
  // The contract text comes from `binding.editorial.required_input_contracts[key]`
  // when the binding declares it; otherwise the codegen emits an empty
  // string and the panel renders an empty state. There is no local catalog
  // fallback.
  const requiredInputs = Array.isArray(task.required_inputs)
    ? (task.required_inputs as string[]).map((key) => ({
        key,
        label: key,
        contract: deriveRequiredInputContract(editorial, key),
      }))
    : [];

  // Optional inputs — derived from `task.optional_inputs` when the binding
  // declares them. Same editorial-derivation contract as required inputs.
  const declaredOptional = Array.isArray(task.optional_inputs)
    ? (task.optional_inputs as string[])
    : null;
  const optionalInputs = declaredOptional
    ? declaredOptional.map((key) => ({
        key,
        label: key,
        contract: deriveOptionalInputContract(editorial, key),
      }))
    : [];

  // Identity block — derived from the binding's `task` fields, the
  // `delivery` block, and the binding's declared transition graph (no
  // positional lookup). The literals are typed as `string` because the
  // binding is the source, not the caller. `initialPhase` / `initialState`
  // come from the unique entry candidate discovered by walking the
  // binding's transition `to` references (F-05R). `configuredMirrors` is
  // derived from the binding's `artifact_store.mirrors[i].required`
  // flag (any required mirror exists; an empty required set under
  // `on_required_mirror_failure: "block"` is a fail-closed error in
  // the persistence block below).
  const delivery = binding.delivery as Record<string, unknown>;
  const entryPosition = findEntryPhaseAndState(binding);
  const initialPhaseId = entryPosition.phaseId;
  const initialStateId = entryPosition.stateId;
  const artifactStorePrimaryForIdentity = artifactStore.primary as { adapter: string; path_pattern: string } | undefined;
  const mirrorsForIdentity = Array.isArray(artifactStore.mirrors)
    ? (artifactStore.mirrors as Array<{ required?: boolean }>)
    : [];
  const requiredMirrorCount = mirrorsForIdentity.filter((m) => m && m.required === true).length;
  if (typeof task.slug_pattern !== 'string') {
    throw new Error(
      'task-flow normalizer: binding task.slug_pattern must be a string before generating identity.',
    );
  }
  const identity = {
    taskIdPattern: String(task.id_pattern),
    taskSlugPattern: task.slug_pattern,
    filePattern: String(task.file_pattern),
    branchPattern: String(delivery.branch_pattern),
    sourceBranch: String(delivery.source_branch),
    targetBranch: String(delivery.target_branch),
    initialStatus: String(status.pre_bootstrap),
    initialPhase: initialPhaseId,
    initialState: initialStateId,
    configuredMirrors: mirrorsForIdentity.length,
    primaryAdapter: artifactStorePrimaryForIdentity?.adapter ?? '',
    primaryPathPattern: artifactStorePrimaryForIdentity?.path_pattern ?? '',
  };

  // Persistence — derived from `artifact_store`. The mirror selection is
  // strictly semantic: required mirrors come from
  // `mirrors.filter(m => m.required === true)` and are sorted by adapter
  // for deterministic output. When exactly one required mirror exists,
  // `mirrorKeyPatterns` is that mirror's key_pattern verbatim. When
  // multiple required mirrors exist (the contract allows it), the codegen
  // surfaces the full collection in `persistence.mode` and joins the
  // patterns in `persistence.mirrorKeyPatterns`. When the binding
  // declares zero required mirrors, the policy `on_required_mirror_failure`
  // is the sole authority on whether to fail closed (block) or to emit
  // a neutral `no required mirror` derivation (degrade / no-block); the
  // decision lives entirely in `selectRequiredMirrors()` — this caller
  // MUST NOT reject an empty collection upstream.
  //
  // F-05R: the previous guard rejected any empty `mirrors[]` here
  // before the policy could run, making the documented
  // `0 required + degrade/no-block` branch unreachable. The guard is
  // narrowed to binding drift (missing field / wrong type) only; an
  // explicit empty array is forwarded to `selectRequiredMirrors()`
  // unchanged. The primary artifact still comes from
  // `artifact_store.primary` directly — no positional fallback.
  const artifactStorePrimary = artifactStore.primary as { adapter: string; path_pattern: string };
  const rawMirrors = artifactStore.mirrors;
  if (rawMirrors !== undefined && !Array.isArray(rawMirrors)) {
    throw new Error(
      'task-flow normalizer: binding declares `artifact_store.mirrors` but the value is not an ' +
        'array. The codegen requires `artifact_store.mirrors[]` to be either absent or an array of ' +
        '{ adapter, required, key_pattern } records. Fix the binding or remove the field.',
    );
  }
  const mirrors: Array<{ adapter: string; required: boolean; key_pattern: string }> = Array.isArray(rawMirrors)
    ? rawMirrors as Array<{ adapter: string; required: boolean; key_pattern: string }>
    : [];
  const onRequiredMirrorFailure = (artifactStore as { on_required_mirror_failure?: string }).on_required_mirror_failure;
  const requiredMirrors = selectRequiredMirrors(mirrors, onRequiredMirrorFailure);
  const requiredAdapters = requiredMirrors.map((m) => m.adapter);
  const persistence = {
    mode: requiredAdapters.length === 0
      ? `${artifactStorePrimary.adapter} primary (no required mirror)`
      : requiredAdapters.length === 1
        ? `${artifactStorePrimary.adapter} primary + ${requiredAdapters[0]} mirror`
        : `${artifactStorePrimary.adapter} primary + ${requiredAdapters.join(', ')} mirrors`,
    mirrorKeyPatterns: requiredMirrors.map((m) => m.key_pattern).join(', '),
    parityRule: '',
    safeWrite: [],
  };

  // Phases — derived strictly from `phases[]`. Editorial labels
  // (title / goal / entry[] / exitGate / errorLoop) come from
  // `binding.editorial.phases[phaseId]` when declared; otherwise empty
  // strings / arrays. The codegen never falls back to a local catalog.
  const phaseBlocks = phases.map((phase, idx) => {
    const states = phase.states.map((stateId) => ({
      id: stateId,
      label: deriveStateLabel(editorial, phase.id, stateId),
      description: deriveStateDescription(editorial, phase.id, stateId),
    }));
    const allowed = phase.allowed_lanes.slice().sort();
    const prohibited = computeProhibitedLanes(phase.id, allowed, allLaneIds);
    return {
      id: phase.id,
       order: idx + 1,
      title: derivePhaseTitle(editorial, phase.id),
      goal: derivePhaseGoal(editorial, phase.id),
      entry: derivePhaseEntry(editorial, phase.id),
      states,
      agents: {
        allowed,
        prohibited,
      },
      exitGate: derivePhaseExitGate(editorial, phase.id),
      errorLoop: derivePhaseErrorLoop(editorial, phase.id),
    };
  });

  // Control actions — derived strictly from `controls[]`. Editorial
  // description / phase come from `binding.editorial.controls[controlId]`
  // when declared; otherwise empty string and `undefined` phase.
  const controlActions = controls.map((control) => {
    const editorialRow = deriveControlEditorial(editorial, control.id);
    const out: {
      id: string;
      phase?: string;
      description: string;
    } = {
      id: control.id,
      description: editorialRow.description,
    };
    if (editorialRow.phase !== undefined) out.phase = editorialRow.phase;
    return out;
  });

  // Named control transitions — semantic projection of every transition
  // declared under `binding.controls[].transitions[]`. The UI consumes these
  // identity/source/target/guard fields directly and never infers a transition
  // from the position of a control, phase, or state in a local array.
  const controlTransitions = controls.flatMap((control) =>
    control.transitions.map((transition) => {
      const out: {
        id: string;
        from: string;
        to: string;
        guard?: string;
      } = {
        id: transition.id,
        from: transition.from,
        to: transition.to,
      };
      if (transition.guard !== undefined) out.guard = transition.guard;
      return out;
    }),
  );

  // Surfaces — derived from `binding.editorial.surfaces[]` when the
  // binding declares them; otherwise an empty array. The previous
  // hardcoded `projectctl-tareas` / `project-workspace` constants are
  // removed (F-05R). The panel renders the empty state when the
  // binding omits this block.
  const surfaces = Array.isArray(editorial?.surfaces)
    ? editorial!.surfaces!.map((s) => {
        const out: {
          id: string;
          path: string;
          kind: string;
          responsibilities: readonly string[];
          forbidden?: readonly string[];
        } = {
          id: s.id,
          path: s.path,
          kind: s.kind,
          responsibilities: s.responsibilities,
        };
        if (Array.isArray(s.forbidden)) out.forbidden = s.forbidden;
        return out;
      })
    : [];

  // Hard-removal rule — derived from `binding.editorial.hard_removal`
  // when the binding declares it; otherwise empty strings. No local
  // fallback text.
  const hardRemoval = {
    rule: editorial?.hard_removal?.rule ?? '',
    stalePrecedence: editorial?.hard_removal?.stale_precedence ?? '',
  };

  // PCT traceability — derived exclusively from the binding's
  // `task.criteria_coverage` block. The codegen never invents the
  // AC↔PCT mapping (the previous hardcoded `expectedAcCount = 16` /
  // `expectedPctBase = 106` / `BINDING_AREA_PATTERNS` array have been
  // removed — they were local defaults that masked binding drift).
  //
  // Contract:
  //   - When the binding declares `task.criteria_coverage.rows[]`, the
  //     codegen exposes those rows verbatim (already validated by
  //     `assertCriteriaCoverageAlign`).
  //   - When the binding declares `task.criteria_coverage.ac_count`
  //     and/or `pct_base` without `rows`, the codegen materialises
  //     well-formed `AC-XXX` / `PCT-XXX` identifiers from those counts
  //     (the panel renders the binding-derived `ac_count` / `pct_base`
  //     count without per-row area strings).
  //   - When the binding omits `task.criteria_coverage`, the codegen
  //     emits an empty `pctTraceability` / `criteriaCovered` payload
  //     and the panel surfaces the missing coverage via the empty
  //     state. The codegen does NOT fabricate a 16/106 mapping.
  const taskObj = binding.task as { criteria_coverage?: unknown };
  const coverage = taskObj.criteria_coverage && typeof taskObj.criteria_coverage === 'object'
    ? (taskObj.criteria_coverage as {
        ac_count?: number;
        pct_base?: number;
        rows?: Array<{ ac: string; pct: string; binding_area: string }>;
      })
    : null;

  const pctTraceability = coverage?.rows
    ? coverage.rows.map((row) => ({
        ac: row.ac,
        pct: row.pct,
        bindingArea: row.binding_area,
      }))
    : [];

  const criteriaCovered = coverage
    ? {
        acCount: typeof coverage.ac_count === 'number' ? coverage.ac_count : (coverage.rows?.length ?? 0),
        pctBase: typeof coverage.pct_base === 'number' ? coverage.pct_base : null,
        pcts: (coverage.rows ?? []).map((row) => row.pct),
        acs: (coverage.rows ?? []).map((row) => row.ac),
        note: '',
      }
    : {
        acCount: 0,
        pctBase: null,
        pcts: [],
        acs: [],
        note: '',
      };

  // Operational references — derived from `binding.editorial.operational_references[]`
  // when the binding declares them; otherwise an empty array. The
  // previous hardcoded list of 11 entries pointing at the projectctl
  // companion files is removed (F-05R).
  const operationalReferences = Array.isArray(editorial?.operational_references)
    ? editorial!.operational_references!.map((r) => ({
        label: r.label,
        path: r.path,
        role: r.role,
      }))
    : [];

  // Intro — derived from `binding.editorial.intro` when the binding
  // declares it; otherwise empty strings. No hardcoded "Flujo
  // normativo de tareas SDD" intro text.
  const intro = {
    title: editorial?.intro?.title ?? '',
    description: editorial?.intro?.description ?? '',
  };

  const viewModel = {
    binding: {
      path: parsed.bindingRepoPath,
      version: fm.version,
      parentSkill: fm.parentSkill,
      role: 'informational-only' as const,
      lastFullRegen: fm.lastFullRegen,
      bindingId: source.binding_id,
      bindingVersion: source.binding_version,
      sourcePath: source.source_path,
      sourceSha256: source.source_sha256,
      contractKind: String(binding.contract_kind),
      modelVersion: Number(binding.model_version),
    },
    intro,
    requiredInputs,
    optionalInputs,
    identity,
    persistence,
    modes: binding.modes,
    artifacts: binding.artifact_store,
    phases: phaseBlocks,
    controlActions,
    controlTransitions,
    surfaces,
    hardRemoval,
    pctTraceability,
    operationalReferences,
    criteriaCovered,
  };

  // ─── Emit the TS file ────────────────────────────────────────────────
  const lines: string[] = [];
  lines.push(
    '/**',
    ' * frontend/src/views/projectctl/data/tareas-tab.view-model.ts',
    ' *',
    ' * ─── GENERATED FILE — DO NOT EDIT BY HAND ─────────────────────────',
    ' *',
    ` * Source of truth: ${source.source_path} (binding ${source.binding_id} v${source.binding_version}).`,
    ` * Source SHA-256: ${source.source_sha256}.`,
    ` * Generated at: ${source.generated_at} (last_full_regen from binding frontmatter).`,
    ' *',
    ' * Regenerate with: bun run taskflow:generate',
    ' * Validate with:   bun run taskflow:check',
    ' *',
    ' * The panel component `TareasTabPanel.tsx` reads this snapshot via',
    ' * `typeof TAREAS_TAB_VIEW_MODEL`; the shape is preserved verbatim from',
    ' * the legacy file so the UI keeps working. Every value is derived from',
    ' * the binding block; the only stable, non-binding inputs are the',
    ' * editorial labels for state entries and the surface separation rows',
    ' * (which the binding does not declare).',
    ' */',
    '',
  );
  lines.push('/* eslint-disable */');
  lines.push('// @ts-nocheck — generated; tsc is exercised by the anti-drift suite.');
  lines.push('');

  // Type exports — preserve the legacy surface verbatim so the panel compiles.
  lines.push(
    'export type PhaseId =',
    `  | ${phases.map((p) => `'${p.id}'`).join('\n  | ')};`,
    '',
  );
  for (const phase of phases) {
    const typeName = `${phase.id.toUpperCase().replace(/_/g, '')}_STATE`;
    lines.push(
      `export type ${typeName} =`,
      ...phase.states.map((s, i) => `  | '${s}'${i === phase.states.length - 1 ? ';' : ''}`),
      '',
    );
  }

  lines.push(
    'export type ControlActionState =',
    `  | ${controls.map((c) => `'${c.id}'`).join('\n  | ')};`,
    '',
  );

  lines.push(
    'export interface RequiredInputRow {',
    '  readonly key: string;',
    '  readonly label: string;',
    '  readonly contract: string;',
    '}',
    '',
    'export interface OptionalInputRow {',
    '  readonly key: string;',
    '  readonly label: string;',
    '  readonly contract: string;',
    '}',
    '',
    'export interface PhaseStateRow {',
    '  readonly id: string;',
    '  readonly label: string;',
    '  readonly description: string;',
    '}',
    '',
    'export interface AgentMatrixRow {',
    '  readonly allowed: readonly string[];',
    '  readonly prohibited: readonly string[];',
    '}',
    '',
    'export interface PhaseBlock {',
    '  readonly id: PhaseId;',
     '  readonly order: number;',
    '  readonly title: string;',
    '  readonly goal: string;',
    '  readonly entry: readonly string[];',
    '  readonly states: readonly PhaseStateRow[];',
    '  readonly agents: AgentMatrixRow;',
    '  readonly exitGate: string;',
    '  readonly errorLoop: string;',
    '}',
    '',
    'export interface ControlActionRow {',
    '  readonly id: ControlActionState;',
    '  readonly description: string;',
     '  readonly phase?: string;',

    '}',
    '',
    'export interface ControlTransitionRow {',
    '  readonly id: string;',
    '  readonly from: string;',
    '  readonly to: string;',
    '  readonly guard?: string;',
    '}',
    '',
    'export interface SurfaceRow {',
     '  readonly id: string;',
     '  readonly path: string;',
     '  readonly kind: string;',

    '  readonly responsibilities: readonly string[];',
    '  readonly forbidden?: readonly string[];',
    '}',
    '',
    'export interface PctTraceRow {',
    '  readonly ac: string;',
    '  readonly pct: string;',
    '  readonly bindingArea: string;',
    '}',
    '',
    'export interface OperationalReferenceRow {',
    '  readonly label: string;',
    '  readonly path: string;',
    '  readonly role: string;',
    '}',
    '',
    'export interface TareasTabViewModel {',
    '  readonly binding: {',
    '    readonly path: string;',
    '    readonly version: string;',
    '    readonly parentSkill: string;',
    "    readonly role: 'informational-only';",
    '    readonly lastFullRegen: string;',
    '    readonly bindingId: string;',
    '    readonly bindingVersion: string;',
    '    readonly sourcePath: string;',
    '    readonly sourceSha256: string;',
    '    readonly contractKind: string;',
    '    readonly modelVersion: number;',
    '  };',
    '  readonly intro: { readonly title: string; readonly description: string };',
    '  readonly requiredInputs: readonly RequiredInputRow[];',
    '  readonly optionalInputs: readonly OptionalInputRow[];',
    '  readonly identity: {',
    '    readonly taskIdPattern: string;',
    '    readonly taskSlugPattern: string;',
    '    readonly filePattern: string;',
    '    readonly branchPattern: string;',
    '    readonly sourceBranch: string;',
    '    readonly targetBranch: string;',
    '    readonly initialStatus: string;',
    '    readonly initialPhase: string;',
    '    readonly initialState: string;',
    '    readonly configuredMirrors: number;',
    '    readonly primaryAdapter: string;',
    '    readonly primaryPathPattern: string;',
    '  };',
    '  readonly persistence: {',
    '    readonly mode: string;',
    '    readonly mirrorKeyPatterns: string;',
    '    readonly parityRule: string;',
    '    readonly safeWrite: readonly string[];',
    '  };',
    '  readonly modes: Readonly<Record<string, unknown>>;',
    '  readonly artifacts: Readonly<Record<string, unknown>>;',
    '  readonly phases: readonly PhaseBlock[];',
    '  readonly controlActions: readonly ControlActionRow[];',
    '  readonly controlTransitions: readonly ControlTransitionRow[];',
    '  readonly surfaces: readonly SurfaceRow[];',
    '  readonly hardRemoval: { readonly rule: string; readonly stalePrecedence: string };',
    '  readonly pctTraceability: readonly PctTraceRow[];',
    '  readonly operationalReferences: readonly OperationalReferenceRow[];',
    '  readonly criteriaCovered: {',
    '    readonly acCount: number;',
    '    readonly pctBase: number | null;',
    '    readonly pcts: readonly string[];',
    '    readonly acs: readonly string[];',
    '    readonly note: string;',
    '  };',
    '}',
    '',
  );

  // The frozen snapshot.
  // Wrap strings as quoted literals so the JSON serializer is sufficient;
  // a tiny dedicated writer ensures the output is byte-deterministic.
  lines.push(
    'export const TAREAS_TAB_VIEW_MODEL: TareasTabViewModel = Object.freeze(',
    canonicalJsonStringify(viewModel, 2)
      .split('\n')
      .map((l, i) => (i === 0 ? l : '  ' + l))
      .join('\n'),
    ');',
    '',
  );

  // Convenience narrowing types.
  lines.push(
    'export type PhaseBlockType = (typeof TAREAS_TAB_VIEW_MODEL.phases)[number];',
    'export type PhaseStateType = PhaseBlockType["states"][number];',
    '',
  );

  return lines.join('\n');
}

/**
 * F-05R (final): the legacy `BINDING_AREA_PATTERNS` local catalog and the
 * `expectedAcCount = 16` / `expectedPctBase = 106` literals were already
 * removed by the previous F-05 rerun. This block is kept as the empty
 * historical marker so the code review can grep for any leftover
 * reference; the codegen derives the AC↔PCT mapping exclusively from
 * `binding.task.criteria_coverage` and emits an empty
 * `pctTraceability` / `criteriaCovered` payload when the binding omits
 * the block. There is no fallback catalogue in this file.
 */

// ─── `sdd-agents.ts` validator ─────────────────────────────────────────

export interface SddAgentsValidation {
  readonly ok: boolean;
  readonly filePath: string;
  readonly present: boolean;
  readonly missingLaneIds: readonly string[];
  readonly forbiddenLaneIds: readonly string[];
  readonly detail: string;
}

/**
 * Validate that `frontend/src/shared/sdd/sdd-agents.ts` exposes the
 * `SDD_AGENT_FLOW_ORDER` array AND that it satisfies the binding:
 *  - every `binding.lanes[*].id` is present in the array;
 *  - no retired alias or unsupported capability is present in the array.
 *
 * The check is intentionally cheap: it does not require TypeScript
 * compilation, only that the file is readable and contains the literal
 * `SDD_AGENT_FLOW_ORDER` array.
 */
export function validateSddAgents(parsed: ParsedBinding, repoRoot: string, filePath: string): SddAgentsValidation {
  const absolutePath = resolve(repoRoot, filePath);
  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      filePath,
      present: false,
      missingLaneIds: [],
      forbiddenLaneIds: [],
      detail: `sdd-agents.ts not found at ${filePath}`,
    };
  }
  const raw = readFileSync(absolutePath, 'utf-8');
  const orderMatch = raw.match(/SDD_AGENT_FLOW_ORDER\s*=\s*\[([\s\S]*?)\]\s*as\s+const/);
  if (!orderMatch) {
    return {
      ok: false,
      filePath,
      present: true,
      missingLaneIds: [],
      forbiddenLaneIds: [],
      detail: 'sdd-agents.ts: SDD_AGENT_FLOW_ORDER array literal not found',
    };
  }
  const literalEntries: string[] = (orderMatch[1].match(/'([a-z0-9-]+)'/g) ?? []).map((s: string) => s.replace(/'/g, ''));
  const order = new Set(literalEntries);
  const lanes = parsed.binding.lanes as Record<string, unknown>;
  // `sdd-agents.ts` is the base SDD UI catalogue. Selected extension lanes
  // are resolved from their own declarations and do not depend on a
  // hand-maintained base frontend catalogue.
  const extensionLaneIds = parsed.binding.extension_lane_modules as Record<string, unknown> | undefined;
  const requiredLaneIds = Object.entries(lanes)
    .filter(([id]) => !extensionLaneIds || !(id in extensionLaneIds))
    .map(([id]) => id)
    .sort();
  const missingLaneIds: string[] = requiredLaneIds.filter((id: string) => !order.has(id));
  const retiredSet = new Set(parsed.binding.retired_aliases as string[]);
  const forbiddenLaneIds: string[] = literalEntries.filter(
    (id: string) => retiredSet.has(id) || id === 'sdd-onboard',
  );
  const ok = missingLaneIds.length === 0 && forbiddenLaneIds.length === 0;
  const detail = ok
    ? `sdd-agents.ts: ${literalEntries.length} entries match binding (${requiredLaneIds.length} lanes required, 0 forbidden)`
    : `sdd-agents.ts: drift — missing lanes [${missingLaneIds.join(', ')}], forbidden lanes [${forbiddenLaneIds.join(', ')}]`;
  return {
    ok,
    filePath,
    present: true,
    missingLaneIds,
    forbiddenLaneIds,
    detail,
  };
}

// ─── Target manifest ───────────────────────────────────────────────────

/**
 * The list of projections the codegen knows about. Adding a new target
 * requires updating this manifest plus `applyGenerators()` below.
 */
export const TARGETS: readonly GenerationTarget[] = Object.freeze([
  Object.freeze({
    id: 'phase-state-schema',
    role: 'JSON projection of the task-flow state model (consumed by the resolver)',
    path: '.agents/skills/projectctl-sdd/generated/phase-state-schema.json',
    kind: 'json',
    mode: 'generated',
  }),
]);

export function findTarget(id: string): GenerationTarget | undefined {
  return TARGETS.find((t) => t.id === id);
}

// ─── Top-level: generate every target + validate `sdd-agents.ts` ────────

export interface GenerateOptions {
  /** Repo root. */
  readonly repoRoot: string;
  /** Override the binding path. */
  readonly bindingPath?: string;
  /** Override the output writer (default: `writeFileSync`). */
  readonly writeFile?: (path: string, content: string) => void;
}

export function generateAll(opts: GenerateOptions): GenerationReport {
  const bindingPath = opts.bindingPath ?? DEFAULT_BINDING_PATH;
  const parsed = parseBindingFile(opts.repoRoot, bindingPath);
  const source = buildSourceMetadata(parsed);
  const write = opts.writeFile ?? ((path: string, content: string) => {
    const absolute = resolve(opts.repoRoot, path);
    writeFileSync(absolute, content, 'utf-8');
  });

  const diffs: GenerationDiff[] = [];

  for (const target of TARGETS) {
    if (target.mode === 'validated') {
      const validation = validateSddAgents(parsed, opts.repoRoot, target.path);
      diffs.push({
        target,
        reason: validation.ok ? 'ok' : 'drift',
        onDiskSha256: null,
        expectedSha256: null,
      });
      if (!validation.ok) {
        throw new Error(
          `taskflow: target "${target.id}" failed validation: ${validation.detail}`,
        );
      }
      continue;
    }
    const generated = generate(parsed, target);
    const expectedSha256 = sha256OfString(generated);
    const absolutePath = resolve(opts.repoRoot, target.path);
    let onDiskSha256: string | null = null;
    let reason: GenerationDiff['reason'] = 'ok';
    if (existsSync(absolutePath)) {
      const onDisk = readFileSync(absolutePath, 'utf-8');
      onDiskSha256 = sha256OfString(onDisk);
      if (onDiskSha256 !== expectedSha256) {
        reason = 'drift';
      }
    } else {
      reason = 'missing';
    }
    diffs.push({ target, reason, onDiskSha256, expectedSha256 });
    if (reason !== 'ok') {
      throw new Error(
        `taskflow: target "${target.id}" (${target.path}) is ${reason} (on-disk ${onDiskSha256 ?? '∅'} vs expected ${expectedSha256})`,
      );
    }
    write(target.path, generated);
  }

  void write;
  return {
    source,
    targets: diffs,
    validators: [],
  };
}

export function generateOne(parsed: ParsedBinding, target: GenerationTarget): string {
  switch (target.id) {
    case 'phase-state-schema':
      return generatePhaseStateSchema(parsed);
    case 'task-flow-generated-ts':
      return generateTaskFlowTs(parsed);
    case 'tareas-tab-view-model':
      return generateTareasTabViewModel(parsed);
    case 'sdd-agents-validator':
      // Validator does not emit content; the caller should invoke
      // `validateSddAgents` instead.
      throw new Error('taskflow: sdd-agents-validator is a validator, not a generator');
    default:
      throw new Error(`taskflow: unknown target "${target.id}"`);
  }
}

// Catch-all dispatch: use the registry below to look up the generator.
function generate(parsed: ParsedBinding, target: GenerationTarget): string {
  return generateOne(parsed, target);
}

function formatBaselineReport(report: BaselineCheckReport): string {
  const digestLines = [
    `locator=${report.digest.locatorSha256 ?? '∅'}`,
    `binding=${report.digest.bindingSha256 ?? '∅'}`,
    `package=${report.digest.packageSkillSha256 ?? '∅'}`,
    `prod=${report.digest.prodOverlaySha256 ?? '∅'}`,
    `dev=${report.digest.devOverlaySha256 ?? '∅'}`,
  ];
  if (report.ok) {
    return [
        `[machine-baseline] ok — package=${CANONICAL_BASELINE.packageVersion} binding=${CANONICAL_BASELINE.bindingVersion} contract=${CANONICAL_BASELINE.contractKind} model=${CANONICAL_BASELINE.modelVersion} locator=${CANONICAL_BASELINE.locatorContractVersion} phases=${CANONICAL_BASELINE.phaseCount}`,
      `[machine-baseline] digest ${digestLines.join(' ')}`,
    ].join('\n');
  }
  const driftLines = report.drifts.map(
    (drift) =>
      `[machine-baseline] DRIFT path=${drift.path} key=${drift.key} expected=${drift.expected} got=${drift.actual}`,
  );
  return [
    ...driftLines,
    `[machine-baseline] digest ${digestLines.join(' ')}`,
    `[machine-baseline] failed with ${report.drifts.length} divergence(s); centralization blocked.`,
  ].join('\n');
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  if (argv.includes('--generate-base-projection')) {
    const repoRoot = resolve(import.meta.dir, '../../../../..');
    const parsed = parseBindingFile(repoRoot);
    const target = TARGETS.find(item => item.id === 'phase-state-schema')!;
    writeFileSync(resolve(repoRoot, target.path), generateOne(parsed, target), 'utf8');
    console.log(`generated base projection: ${target.path}`);
    process.exit(0);
  }
  const checkBaseline = argv.includes('--check-baseline') || argv.includes('--check');
  if (!checkBaseline && !argv.includes('--help') && !argv.includes('-h')) {
    console.error('task-flow-normalizer: use --check-baseline (Stage 0 machine tuple scanner)');
    process.exit(2);
  }
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(
      [
        'Usage: bun scripts/skill/task-flow-normalizer.ts --check-baseline',
        '',
        `Fail-closed Stage 0 scanner for package=${CANONICAL_BASELINE.packageVersion}, binding=${CANONICAL_BASELINE.bindingVersion},`,
        `${CANONICAL_BASELINE.contractKind}, model_version=${CANONICAL_BASELINE.modelVersion}, locator V${CANONICAL_BASELINE.locatorContractVersion}, ${CANONICAL_BASELINE.phaseCount} phases, and`,
        'Portable binding and base phases (environment overlays belong to the destination).',
      ].join('\n'),
    );
    process.exit(0);
  }
  const repoRoot = resolve(import.meta.dir, '../../../../..');
  const report = checkMachineBaseline(repoRoot);
  console.log(formatBaselineReport(report));
  process.exit(report.ok ? 0 : 1);
}
