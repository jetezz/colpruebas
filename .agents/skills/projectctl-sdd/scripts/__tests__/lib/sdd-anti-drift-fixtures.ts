/**
 * `.agents/skills/projectctl-sdd/scripts/__tests__/lib/sdd-anti-drift-fixtures.ts`
 *
 * WU-13 (`sdd-apply-unit-tests`, task 20260722-tskflow-centralizar-flujo-tareas-sdd §10,
 * instancia origen, no portable) — portable
 * helper that backs the cross-project portability fixture required by REQ-TSKFLOW-013
 * (SC-TSKFLOW-023). Bundled in one file because WU-13 constrains the
 * allow-list to the owned `*.test.ts` files plus at most one
 * portable helper under `scripts/__tests__/lib/`.
 *
 * This file is NOT itself a `*.test.ts`. Bun's test discovery ignores
 * it. It is imported by the five owned test files via relative path
 * and exposed for ad-hoc imports from sibling tooling.
 *
 * Design contract (REQ-TSKFLOW-013, SC-TSKFLOW-022, SC-TSKFLOW-023):
 *
 *  - The portable binding fixture (`buildPortableBinding()`) emits a
 *    fully-formed `TaskFlowBindingV1` object with deliberately foreign
 *    values: branch base `main`, filesystem-only primary store
 *    (no Engram mirror), 3 phase ids, 6 state ids, 4 control ids,
 *    status set `{draft, queued, active, shipped}`, task id regex
 *    `^[A-Z]{2}-\d+$`. It contains zero `mis-proyectos` / `taskReadme`
 *    / `Engram` / `develop` / `fase_*` literals — only the foreign
 *    identifiers. Tests that parse this fixture prove the parser and
 *    the gates never assume a local default.
 *  - Assertion helpers (`assertHasPath`, `assertEqualWithPath`)
 *    require every failure to include the requirement identifier,
 *    the resolved path and the divergent value. This is the explicit
 *    "each failure MUST name REQ, path and value" clause of
 *    SC-TSKFLOW-022.
 *
 * Bun-runtime only. No `npx`, no `npm install`. No `node:fs`, no
 * `node:child_process`; this helper is pure data. The owned test files
 * that import it do their own filesystem
 * access via `node:fs/promises` per their existing convention.
 */

/**
 * Returns a reason string that identifies the gate failure. Use it
 * in assertion messages to surface the REQ + path + value triple required by
 * SC-TSKFLOW-022.
 */
export function gateReason(req: string, path: string, value: string, why: string): string {
  return `${req}: path=${path} value=${value} -> ${why}`;
}

// ─── Portable binding fixture (REQ-TSKFLOW-013, SC-TSKFLOW-023) ──────

/**
 * Foreign lane ids used by the portable fixture. The set is closed
 * (no `sdd-` prefix) so any match against a real `sdd-*` id is a
 * failed portability test.
 */
export const PORTABLE_LANE_IDS: readonly string[] = Object.freeze([
  "apply-low",
  "apply-medium",
  "apply-high",
  "apply-doc",
  "verify-code",
  "verify-units",
]);

/**
 * Foreign phase ids used by the portable fixture.
 */
export const PORTABLE_PHASE_IDS: readonly string[] = Object.freeze([
  "phase_discuss",
  "phase_build",
  "phase_close",
]);

/**
 * Foreign status ids used by the portable fixture.
 */
export const PORTABLE_STATUS_IDS: readonly string[] = Object.freeze([
  "draft",
  "queued",
  "active",
  "shipped",
]);

/**
 * Foreign retired aliases (no `mis-proyectos` literals). Used by the
 * anti-drift test to confirm no `retired_aliases` from the
 * local binding leaks into the portable consumer.
 */
export const PORTABLE_RETIRED_ALIASES: readonly string[] = Object.freeze([
  "old_status_a",
  "old_status_b",
  "lane_old",
]);

/**
 * Foreign mirror key pattern. Deliberately not `sdd/<change>/<artifact>`
 * to prove the parser does not hardcode the local template.
 */
export const PORTABLE_MIRROR_KEY_PATTERN = "track/<sdd_change_id>/<artifact>";

export interface PortableBinding {
  readonly binding_id: string;
  readonly binding_version: string;
  readonly model_version: number;
  readonly task: {
    readonly required_inputs: readonly string[];
    readonly id_pattern: string;
    readonly slug_pattern: string;
    readonly file_pattern: string;
    readonly heading_owners: Readonly<Record<string, string>>;
  };
  readonly artifact_store: {
    readonly primary: { readonly adapter: string; readonly path_pattern: string; readonly owner: string };
    readonly mirrors: readonly Array<{ readonly adapter: string; readonly required: boolean; readonly key_pattern: string; readonly owner: string }>;
    readonly write_order: readonly string[];
    readonly on_required_mirror_failure: "block" | "degrade";
    readonly availability_values: readonly string[];
  };
  readonly status: {
    readonly writable: readonly string[];
    readonly pre_bootstrap: string;
    readonly terminal: string;
  };
  readonly phases: ReadonlyArray<{
    readonly id: string;
    readonly status: string;
    readonly states: readonly string[];
    readonly allowed_lanes: readonly string[];
    readonly transitions: ReadonlyArray<{ readonly from: string; readonly to: string; readonly guard?: string }>;
  }>;
  readonly controls: ReadonlyArray<{
    readonly id: string;
    readonly kind: string;
    readonly writes_state: boolean;
    readonly value?: { readonly phase: string | null; readonly state: string; readonly status: string };
    readonly status?: string;
    readonly preserves?: readonly string[];
    readonly owner: string;
    readonly transitions: readonly Array<{ readonly to: string; readonly guard?: string }>;
  }>;
  readonly lanes: Readonly<Record<string, { readonly skill: string; readonly apply_lane?: "code-low" | "code-medium" | "code-high"; readonly role: string; readonly artifact_class: string; readonly owner_phase: string }>>;
  readonly gates: Readonly<Record<string, { readonly evaluator: string; readonly required_evidence: readonly string[]; readonly failure: string }>>;
  readonly delivery: {
    readonly source_branch: string;
    readonly target_branch: string;
    readonly branch_pattern: string;
    readonly action_order: readonly string[];
    readonly required_evidence_at_close: readonly string[];
  };
  readonly active_sources: { readonly include: readonly string[]; readonly exclude: readonly string[] };
  readonly retired_aliases: readonly string[];
}

/**
 * Build a fully-formed `PortableBinding` that satisfies the
 * `TaskFlowBindingV1` shape but carries deliberately foreign values.
 * The fixture proves the resolver + anti-drift suite do not assume
 * `mis-proyectos`-specific literals; a foreign consumer can run the
 * same gates against its own binding without code changes.
 *
 * Returns a fresh object every call so each test can mutate
 * selectively without cross-contamination.
 */
export function buildPortableBinding(): PortableBinding {
  return {
    binding_id: "demo-org.test-bed",
    binding_version: "1.0.0",
    model_version: 1,
    task: {
      required_inputs: ["feature_name", "feature_rationale"],
      id_pattern: "^[A-Z]{2}-\\d+$",
      slug_pattern: "^[a-z][a-z0-9-]*$",
      file_pattern: "plans/<task_id>-<task_slug>.md",
      heading_owners: {
        objective: "sdd-orchestrator",
        scope: "apply-low",
        criteria: "apply-medium",
      },
    },
    artifact_store: {
      primary: {
        adapter: "filesystem",
        path_pattern: "plans/<task_id>-<task_slug>.md",
        owner: "plans <task_id>-<task_slug>.md",
      },
      mirrors: [
        {
          adapter: "tracker:github",
          required: true,
          key_pattern: PORTABLE_MIRROR_KEY_PATTERN,
          owner: "tracker:github",
        },
      ],
      write_order: ["primary", "mirrors[0]"],
      on_required_mirror_failure: "block",
      availability_values: ["available", "unavailable", "unknown"],
    },
    status: {
      writable: [...PORTABLE_STATUS_IDS],
      pre_bootstrap: "draft",
      terminal: "shipped",
    },
    phases: [
      {
        id: "phase_discuss",
        status: "draft",
        states: ["pds_start", "pds_review"],
        allowed_lanes: ["apply-low", "apply-medium"],
        transitions: [
          { from: "pds_start", to: "pds_review", guard: "rationale_complete" },
        ],
      },
      {
        id: "phase_build",
        status: "active",
        states: ["pdb_implement", "pdb_verify", "pdb_finish"],
        allowed_lanes: ["apply-medium", "apply-high", "verify-code"],
        transitions: [
          { from: "pdb_implement", to: "pdb_verify", guard: "code_apply_evidence_complete" },
          { from: "pdb_verify", to: "pdb_finish", guard: "code_review_passed" },
          { from: "pdb_finish", to: "phase_close", guard: "approval_recorded" },
        ],
      },
      {
        id: "phase_close",
        status: "queued",
        states: ["pcl_document", "pcl_archived"],
        allowed_lanes: ["apply-doc"],
        transitions: [
          { from: "pcl_document", to: "pcl_archived", guard: "doc_apply_evidence_complete" },
        ],
      },
    ],
    controls: [
      {
        id: "branch_creation_pending",
        kind: "action",
        writes_state: true,
        value: { phase: "phase_discuss", state: "branch_creation_pending", status: "draft" },
        owner: "sdd-orchestrator",
        transitions: [{ to: "pds_review", guard: "branch_available" }],
      },
      {
        id: "final_pr_pending",
        kind: "action",
        writes_state: true,
        value: { phase: "phase_close", state: "final_pr_pending", status: "queued" },
        owner: "sdd-orchestrator",
        transitions: [{ to: "shipped", guard: "pr_url_recorded" }],
      },
      {
        id: "shipped",
        kind: "terminal",
        writes_state: true,
        value: { phase: null, state: "shipped", status: "shipped" },
        owner: "sdd-orchestrator",
        transitions: [],
      },
      {
        id: "blocked",
        kind: "outcome",
        writes_state: false,
        status: "blocked",
        preserves: ["phase", "state"],
        owner: "sdd-orchestrator",
        transitions: [],
      },
    ],
    lanes: {
      "apply-low": { skill: "unified-code", apply_lane: "code-low", role: "apply", artifact_class: "plan", owner_phase: "phase_discuss" },
      "apply-medium": { skill: "unified-code", apply_lane: "code-medium", role: "apply", artifact_class: "spec", owner_phase: "phase_build" },
      "apply-high": { skill: "unified-code", apply_lane: "code-high", role: "apply", artifact_class: "code_evidence", owner_phase: "phase_build" },
      "verify-code": { skill: "review-code", role: "verification", artifact_class: "code_review", owner_phase: "phase_build" },
      "verify-units": { skill: "review-units", role: "verification", artifact_class: "unit_test_review", owner_phase: "phase_build" },
      "apply-doc": { skill: "write-docs", role: "apply", artifact_class: "documentation_evidence", owner_phase: "phase_close" },
    },
    gates: {
      rationale_complete: {
        evaluator: "evidence",
        required_evidence: ["rationale_recorded"],
        failure: "retain_phase_and_state",
      },
      code_review_passed: {
        evaluator: "hard_gate",
        required_evidence: ["verify_code_green"],
        failure: "retain_phase_and_state",
      },
      approval_recorded: {
        evaluator: "transition_gate",
        required_evidence: ["user_approval_recorded"],
        failure: "retain_phase_and_state",
      },
      doc_apply_evidence_complete: {
        evaluator: "evidence",
        required_evidence: ["doc_recorded"],
        failure: "retain_phase_and_state",
      },
      branch_available: {
        evaluator: "transition_gate",
        required_evidence: ["branch_created"],
        failure: "retain_phase_and_state",
      },
      pr_url_recorded: {
        evaluator: "hard_gate",
        required_evidence: ["pr_url", "branch_name"],
        failure: "retain_phase_and_state",
      },
    },
    delivery: {
      source_branch: "main",
      target_branch: "main",
      branch_pattern: "feature/<task_id>-<task_slug>",
      action_order: ["final_pr_pending", "shipped"],
      required_evidence_at_close: ["branch_name", "pr_url", "all_work_units_terminal"],
    },
    active_sources: {
      include: ["plans/<task_id>-<task_slug>.md", "tracker-config.json"],
      exclude: ["legacy/", "vendor/"],
    },
    retired_aliases: [...PORTABLE_RETIRED_ALIASES],
  };
}

/**
 * The list of `mis-proyectos` literals the anti-drift suite must
 * NEVER observe in a portable artifact. Tests that scan the fixture
 * use this allow-list to confirm portability.
 */
export const FORBIDDEN_LOCAL_LITERALS: readonly string[] = Object.freeze([
  "taskReadme",
  "Engram",
  "mis-proyectos",
  "projectctl-sdd",
  "fase_",
  "p1_started",
  "p2_planning",
  "p3_",
  "p4_",
  "sdd-apply",
  "sdd-apply-code",
  "sdd-explore",
  "sdd-verify",
  "sdd-browser-runtime-context",
]);

/**
 * Scan `text` for any `FORBIDDEN_LOCAL_LITERALS` match (whole-word,
 * case-insensitive). Returns the offending literals, in order.
 */
export function scanForbiddenLiterals(text: string): string[] {
  const offenders: string[] = [];
  for (const literal of FORBIDDEN_LOCAL_LITERALS) {
    // Word-boundary heuristic; respects underscores so `sdd-apply`
    // is matched standalone (not inside `sdd-apply-code-...`).
    const escaped = literal.replace(/[-]/g, "\\-");
    const re = new RegExp(`(?<![-_a-zA-Z])${escaped}(?![-_a-zA-Z])`, "i");
    if (re.test(text)) offenders.push(literal);
  }
  return offenders;
}

// ─── Gold SHAs for codegen drift detection (REQ-TSKFLOW-013) ─────────
//
// Finding #2 of `sdd-verify-code` (taskReadme §15, 2026-07-22): the
// legacy codegen drift gate in the origin instance
// (instancia origen, no portable) re-derived the
// expected SHA from `generateOne()` at runtime and compared it to
// the on-disk file. When the generator itself went stale (i.e. its
// output diverged from the canonical binding block), the on-disk
// file still matched the stale generator output and the test
// silently passed — a false negative that hid real binding↔derived
// drift (finding #1 of the same review).
//
// Remediation: pin the canonical on-disk SHAs as constants and
// compare BOTH the on-disk file and the fresh `generateOne()` output
// against the pinned gold. The test now fails in both directions:
//   - on-disk SHA drifts from gold (manual edit or stale file).
//   - generator output drifts from gold (stale generator, even when
//     the on-disk file happens to match the stale generator output).
//
// The gold values below were recorded from the on-disk targets after
// the binding regenerated against the canonical binding block
// (binding source_sha256 `3b3c1e629a1d62efd3197f81743840b7b3dd66d2a83a918117560add6b51bc6e`).
// They are independent of `source.source_sha256` (which lives inside
// the generated files) and of the binding's file-bytes SHA (which
// changes with any header edit); the contract enforced here is that
// the *entire file contents* — banners, metadata, canonical block,
// trailing newline — match the gold byte for byte.
//
// Update contract: the gold SHA must be refreshed ONLY when the
// binding canonical block is regenerated and the three targets are
// rewritten via `bun run taskflow:generate`. Run
// `sha256sum <paths>` and update these three constants in the same
// commit. Any drift caught by the gate without a paired gold update
// is the symptom the finding describes.
//
// History of pinned gold values (file-bytes SHA-256):
//   - 2026-07-22 initial remediation-3:
//       `phase-state-schema.json`  `ad12e7afb845a3ac66efb6b9e1a3ee09ab6ed8a93019a2b7c6cd6eb8c312fd1f`
//       `task-flow.generated.ts`   `55e2ce787f772c10723230c70b605adda1dcfbdfa10a5d89a07edb3516a2c2b6`
//       `tareas-tab.view-model.ts` `3ea13fec771187777599505815420d05fe124f6caac122033d3166d214aa80bd`
//   - 2026-07-23 after `sdd-apply-unit-tests-final` final (this lane):
//       binding source_sha256      `3b3c1e629a1d62efd3197f81743840b7b3dd66d2a83a918117560add6b51bc6e`
//       `phase-state-schema.json`  `0312347dec21db90ea0231d5f9a6e538fdcff0bb244928fb2233ac3309b37aef`
//       `task-flow.generated.ts`   `115b94caec5d2a9dc801a981ab41791b656fe322660600aa2d2a93b4548a9f09`
//       `tareas-tab.view-model.ts` `e89cca6448e7a6dd6bde531c87e7162a7be37ae5ac2552cab3972e60a7eff187`
//     The `tareas-tab.view-model.ts` and `task-flow.generated.ts` SHAs
//     moved because the codegen was re-run after the F-05R
//     no-positional derivation lane re-emitted the binding-owned
//     `identity.taskIdPattern` / `initialPhase` / `initialState` /
//     `persistence.mode` / `persistence.mirrorKeyPatterns` /
//     `persistence.safeWrite` block from the new semantic selectors.
//     The `phase-state-schema.json` SHA moved because the binding
//     frontmatter `last_full_regen` was bumped during the WU-04
//     evidence pass that landed the `final_commit_pending_code_review_reentry`
//     transition; the bytes are otherwise structurally identical to
//     the previous WU-11 regeneration.
//     This lane updates the gold because the test contract is
//     "byte-for-byte equality with the canonical generator output";
//     any future drift will fail loudly via `assertCodegenDriftGate`.
//   - 2026-09-10 after the binding regenerated to v10.0.0
//     (taskReadme `20260910-verdeall-verde-test-lint-docs`):
//       binding source_sha256      `06d45ec9ce38f39917a47c45d4c14815d13bdf8f73d2e67170ba74f4c12b7ad2`
//       `phase-state-schema.json`  `99e7a06d0ec4f2caebe5d247feed43984a60eef297eb03775c14da81ea9e2c61`
//       `task-flow.generated.ts`   `58742c089c8d64e2c340390050796fc3f8d73cd31f678fbc5f639f0a5ec85e54`
//       `tareas-tab.view-model.ts` `0cdf136dcbccfe5fae3d44420c1854f8a5504ed5a69bb6c9220f0371ee61ed56`
//     The canonical v10 projections now carry the environment-deferral
//     contract (`environment_verification_deferred` admission guard,
//     `pending_environment_close_block` close gate, `{Go,Docker,PW,Git-real}`
//     method enum) as `#/environment_deferral` in the schema, as
//     `TASK_FLOW_ENVIRONMENT_DEFERRAL` in the typed projection, and as
//     `ENVIRONMENT_DEFERRAL_DISPLAY` in the view-model snapshot.
//     The `bun run taskflow:check` gate was green on the same commit
//     the gold values below were recorded from the on-disk targets
//     (`sha256sum`). This lane updates the gold because the test
//     contract is "byte-for-byte equality with the canonical generator
//     output"; any future drift will fail loudly via
//     `assertCodegenDriftGate`.
// pinned by the constants below — the gold SHA gate is new and was
// not present before this remediation.

/**
 * Gold SHA-256 of the on-disk bytes of the 3 generated targets at
 * the moment the generated projections were refreshed from the current
 * canonical binding block (`binding_id: projectctl-requirements.task-flow`).
 *
 * These three constants are the gate of records: any drift caught by
 * `assertCodegenDriftGate()` without a paired update here is the
 * symptom the F-05R finding describes. The constants are exported
 * (not internal) so the test files can also do byte-level checks
 * against them when the JSON shape is not sufficient (see
 * `codegen-tareas-tab.test.ts`).
 */
export const GOLD_SHA_PHASE_STATE_SCHEMA =
  "fb33b41c1d5f48fb6b370c20f727f017a5f4d3c478333b5b82f2223b45a9df78" as const;

export const GOLD_SHA_TASK_FLOW_GENERATED_TS =
  "2ed88ceedceb3351473b8fd290b1db60a5fdc7f60cc21d5a059f325ddb5c8e84" as const;

export const GOLD_SHA_TAREAS_TAB_VIEW_MODEL =
  "b7c262db0ace02acb68040c77ad2a81a0e53d8c326182018efc676adf9ee890a" as const;

/**
 * Manifest mapping `findTarget()` ids to their gold on-disk SHAs.
 * Order MUST match the canonical generator targets in
 * `scripts/task-flow-normalizer.ts:TARGETS` for the generated mode.
 */
export const GOLD_SHAS_BY_TARGET_ID: Readonly<Record<string, string>> = Object.freeze({
  "phase-state-schema": GOLD_SHA_PHASE_STATE_SCHEMA,
  "task-flow-generated-ts": GOLD_SHA_TASK_FLOW_GENERATED_TS,
  "tareas-tab-view-model": GOLD_SHA_TAREAS_TAB_VIEW_MODEL,
});

/**
 * Identifier of the requirement that owns this gate. Surfaced in
 * every diagnostic for traceability per SC-TSKFLOW-022.
 */
export const CODEDGEN_DRIFT_GATE_REQ = "REQ-TSKFLOW-013 SC-TSKFLOW-018 AC-011 AC-013";

/**
 * Discriminated outcome of the codegen drift gate. `ok` is `true`
 * only when BOTH the on-disk file and the fresh `generateOne()`
 * output equal the pinned gold. On failure, `expected` is the
 * pinned gold and `actual` is the divergent value (`onDiskSha` for
 * a manual-edit failure, `generatorSha` for a stale-generator
 * failure).
 */
export interface CodegenDriftCheck {
  readonly ok: boolean;
  readonly req: string;
  readonly targetId: string;
  readonly path: string;
  readonly expected: string;
  readonly actual: string;
  readonly why: string;
  readonly onDiskSha: string;
  readonly generatorSha: string;
}

/**
 * Run the codegen drift gate against a target's on-disk file and
 * the fresh `generateOne()` output.
 *
 * Returns a structured `CodegenDriftCheck` so the calling test can
 * format its own `fail()` diagnostic with `gateReason()`. This
 * helper performs NO I/O and NO throwing; the test file is the one
 * that owns the `throw new Error(...)` boundary.
 *
 * Precedence of the two checks (per the finding):
 *   1. on-disk SHA vs gold — catches manual edits.
 *   2. generator SHA vs gold — catches stale generators (the case
 *      the legacy re-derivation test missed).
 *
 * The two checks are intentionally NOT collapsed into a single
 * `onDiskSha === generatorSha` test, because that equality is
 * trivially true whenever both come from the same stale run and
 * never detects drift against the canonical binding block.
 */
export function assertCodegenDriftGate(args: {
  readonly req?: string;
  readonly targetId: string;
  readonly path: string;
  readonly onDiskSha: string;
  readonly generatorSha: string;
}): CodegenDriftCheck {
  const req = args.req ?? CODEDGEN_DRIFT_GATE_REQ;
  const expected = GOLD_SHAS_BY_TARGET_ID[args.targetId];
  if (expected === undefined) {
    return {
      ok: false,
      req,
      targetId: args.targetId,
      path: args.path,
      expected: "<gold-pinned>",
      actual: `unknown target id "${args.targetId}"`,
      why: "gold manifest has no entry for this target id; cannot check drift",
      onDiskSha: args.onDiskSha,
      generatorSha: args.generatorSha,
    };
  }
  if (args.onDiskSha !== expected) {
    return {
      ok: false,
      req,
      targetId: args.targetId,
      path: args.path,
      expected,
      actual: args.onDiskSha,
      why: "on-disk SHA drifted from the pinned gold (manual edit or stale file)",
      onDiskSha: args.onDiskSha,
      generatorSha: args.generatorSha,
    };
  }
  if (args.generatorSha !== expected) {
    return {
      ok: false,
      req,
      targetId: args.targetId,
      path: args.path,
      expected,
      actual: args.generatorSha,
      why: "generator output drifted from the pinned gold (stale generator — the case finding #2 calls out)",
      onDiskSha: args.onDiskSha,
      generatorSha: args.generatorSha,
    };
  }
  return {
    ok: true,
    req,
    targetId: args.targetId,
    path: args.path,
    expected,
    actual: args.onDiskSha,
    why: "on-disk SHA equals gold AND generator output equals gold",
    onDiskSha: args.onDiskSha,
    generatorSha: args.generatorSha,
  };
}

/**
 * Convenience wrapper that composes a SC-TSKFLOW-022-compatible
 * diagnostic (`REQ + path + expected + actual + why`) from a
 * `CodegenDriftCheck`. Useful when the test wants a single string
 * for `throw new Error(...)` or for a `gateReason()` argument.
 */
export function codegenDriftDiagnostic(check: CodegenDriftCheck): string {
  return gateReason(check.req, check.path, `expected=${check.expected} actual=${check.actual}`, check.why);
}

// WU-04-RED: desired breaking identity. These values intentionally do not
// relax the existing v8 gold fixtures; WU-07 alone owns regenerated SHAs.
export const RDD_V2_EXPECTED_IDENTITY = Object.freeze({
  contractKind: "TaskFlowBindingV2",
  bindingVersion: "16.0.0",
  modelVersion: 2,
  packageVersion: "18.0.0",
});

export const RDD_MODE_VALUES = Object.freeze(["disabled", "receipt-driven"] as const);
export const RDD_PHASE_STATES = Object.freeze([
  "p5_started",
  "p5_reviewing",
  "p5_correction_required",
  "p5_validating",
  "p5_complete",
  "p5_escalated",
] as const);
export const RDD_LANE_IDS = Object.freeze([
  "rdd-review-risk",
  "rdd-review-readability",
  "rdd-review-reliability",
  "rdd-review-resilience",
  "rdd-refuter",
  "rdd-correct",
  "rdd-validate",
] as const);
export const RDD_DELIVERY_GATES = Object.freeze([
  "post-apply",
  "pre-commit",
  "pre-push",
  "pre-pr",
  "release",
] as const);

/*
| Fixture | Skill | Path |
| --- | --- | --- |
| focal | sdd-apply-code | .agents/skills/sdd-apply-code/SKILL.md |
| focal | sdd-verify-code | .agents/skills/sdd-verify-code/SKILL.md |
 | focal | judgment-day | .agents/skills/projectctl-judgment-day/SKILL.md |
| focal | work-unit-commits | .agents/skills/work-unit-commits/SKILL.md |
| focal | chained-pr | .agents/skills/chained-pr/SKILL.md |
*/

// Focused registry fixture for unit tests that exercise resolver semantics.
// It deliberately avoids the unrelated, host-specific generated `.atl` state.
export const FOCAL_SKILL_REGISTRY_PATH =
  ".agents/skills/projectctl-sdd/scripts/__tests__/lib/sdd-anti-drift-fixtures.ts" as const;
