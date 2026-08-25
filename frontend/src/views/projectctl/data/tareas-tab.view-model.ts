/**
 * AUTO-GENERATED from projectctl-requirements task-flow-binding v9.0.0 — do not edit by hand.
 *
 * Client view model for the `/projectctl` tareas tab. This is a derived projection
 * (non-authoritative) of the delimited `task-flow-binding` block in
 * `.agents/skills/projectctl-requirements/references/tareas.md`. It derives its structure
 * from `task-flow.generated.ts` and exposes data only — no business logic.
 *
 * Regenerate with `taskflow:generate` after editing the binding; do not edit manually.
 */
import {
  CONTROLS,
  DELIVERY,
  STATUS_PRE_BOOTSTRAP,
  STATUS_TERMINAL,
  STATUS_WRITABLE,
  TASK_FLOW_BINDING,
  RETIRED_ALIASES,
  type TaskFlowPhase,
} from '../../../shared/sdd/task-flow.generated.ts';

export interface TareasTabPhaseGroup extends TaskFlowPhase {}

export interface TareasTabControlSummary {
  id: string;
  kind: 'action' | 'outcome' | 'terminal';
  writesState: boolean;
  status: string | null;
}

export interface TareasTabDelivery {
  sourceBranch: string;
  targetBranch: string;
  branchPattern: string;
  actionOrder: readonly string[];
}

export interface TareasTabMode {
  id: 'review' | 'delivery';
  default: string;
  allowed: readonly string[];
}

const TAREAS_TAB_PHASES: readonly TareasTabPhaseGroup[] = [
  {
    id: 'fase_1_propuesta',
    status: 'planning',
    states: [
      'p1_started',
      'p1_exploring',
      'p1_drafting',
      'p1_awaiting_acceptance',
      'p1_revision_requested',
      'p1_accepted',
    ],
    allowedLanes: [
      'sdd-init',
      'sdd-explore-code',
      'sdd-explore-research',
      'sdd-explore-pwcli',
      'sdd-propose',
    ],
    transitions: [
      { from: 'p1_started', to: 'p1_exploring' },
      { from: 'p1_exploring', to: 'p1_drafting' },
      { from: 'p1_drafting', to: 'p1_awaiting_acceptance' },
      { from: 'p1_awaiting_acceptance', to: 'p1_revision_requested', guard: 'proposal_feedback_or_rejection' },
      { from: 'p1_revision_requested', to: 'p1_drafting' },
      { from: 'p1_awaiting_acceptance', to: 'p1_accepted', guard: 'AC-010.explicit_approval' },
      { from: 'p1_accepted', to: 'branch_creation_pending', guard: 'AC-010.passed' },
    ],
  },
  {
    id: 'fase_2_implementacion',
    status: 'implementing',
    states: [
      'p2_planning',
      'p2_implementing',
      'p2_code_review',
      'p2_awaiting_acceptance',
      'p2_revision_requested',
      'p2_accepted',
    ],
    allowedLanes: [
      'sdd-spec',
      'sdd-design',
      'sdd-tasks',
      'sdd-apply-code-low',
      'sdd-apply-code-medium',
      'sdd-apply-code-high',
      'sdd-verify-code',
      'judgment-day',
    ],
    transitions: [
      { from: 'p2_planning', to: 'p2_implementing', guard: 'planning_artifacts_complete' },
      { from: 'p2_implementing', to: 'p2_code_review', guard: 'code_apply_evidence_complete' },
      { from: 'p2_code_review', to: 'p2_revision_requested', guard: 'code_review_failed' },
      { from: 'p2_revision_requested', to: 'p2_implementing' },
      { from: 'p2_code_review', to: 'p2_awaiting_acceptance', guard: 'code_review_passed' },
      { from: 'p2_awaiting_acceptance', to: 'p2_revision_requested', guard: 'functional_acceptance_rejected' },
      { from: 'p2_awaiting_acceptance', to: 'p2_accepted', guard: 'functional_acceptance_explicit' },
      { from: 'p2_accepted', to: 'p3_test_preparing', guard: 'functional_acceptance_recorded' },
    ],
  },
  {
    id: 'fase_3_verificacion',
    status: 'testing',
    states: [
      'p3_test_preparing',
      'p3_test_running',
      'p3_test_fixing',
      'p3_coverage_pending',
      'p3_complete',
    ],
    allowedLanes: [
      'sdd-apply-unit-tests',
      'sdd-apply-pwauto-tests',
      'sdd-verify-units',
      'sdd-verify-pwauto',
      'sdd-verify-pwcli',
    ],
    transitions: [
      { from: 'p3_test_preparing', to: 'p3_test_running', guard: 'coverage_matrix_ready' },
      { from: 'p3_test_running', to: 'p3_test_fixing', guard: 'test_failure_or_missing_test' },
      { from: 'p3_test_fixing', to: 'p3_test_running' },
      { from: 'p3_test_running', to: 'p3_coverage_pending', guard: 'coverage_incomplete' },
      { from: 'p3_coverage_pending', to: 'p3_test_preparing' },
      { from: 'p3_coverage_pending', to: 'p4_started', guard: 'phase4_owned_dependencies_only' },
      { from: 'p3_test_running', to: 'p2_revision_requested', guard: 'functional_defect_found' },
      { from: 'p3_test_running', to: 'p3_complete', guard: 'coverage_gate_passed' },
      { from: 'p3_complete', to: 'p4_started', guard: 'coverage_gate_passed' },
    ],
  },
  {
    id: 'fase_4_documentacion',
    status: 'documenting',
    states: [
      'p4_started',
      'p4_documenting',
      'p4_reviewing',
      'p4_revision_requested',
      'p4_complete',
    ],
    allowedLanes: ['sdd-apply-doc'],
    transitions: [
      { from: 'p4_started', to: 'p4_documenting' },
      { from: 'p4_documenting', to: 'p4_reviewing', guard: 'documentation_apply_evidence_complete' },
      { from: 'p4_reviewing', to: 'p4_revision_requested', guard: 'documentation_gate_failed' },
      { from: 'p4_revision_requested', to: 'p4_documenting' },
      { from: 'p4_reviewing', to: 'p3_test_preparing', guard: 'documentation_changed_requires_reverification' },
      { from: 'p4_reviewing', to: 'p4_complete', guard: 'documentation_gate_passed' },
      { from: 'p4_complete', to: 'final_commit_pending' },
    ],
  },
] as const;

const TAREAS_TAB_CONTROLS: readonly TareasTabControlSummary[] = CONTROLS.map(
  (c) => ({
    id: c.id,
    kind: c.kind,
    writesState: c.writesState,
    status: c.value?.status ?? c.status ?? null,
  }),
);

const TAREAS_TAB_DELIVERY: TareasTabDelivery = {
  sourceBranch: DELIVERY.sourceBranch,
  targetBranch: DELIVERY.targetBranch,
  branchPattern: DELIVERY.branchPattern,
  actionOrder: DELIVERY.actionOrder,
};

const TAREAS_TAB_MODES: readonly TareasTabMode[] = [
  {
    id: 'review',
    default: 'sdd-verify-code',
    allowed: ['sdd-verify-code', 'judgment-day'],
  },
  {
    id: 'delivery',
    default: 'single-pr',
    allowed: ['single-pr', 'work-unit-commits'],
  },
];

export const TAREAS_TAB_VIEW_MODEL = {
  binding: TASK_FLOW_BINDING,
  status: {
    writable: STATUS_WRITABLE,
    preBootstrap: STATUS_PRE_BOOTSTRAP,
    terminal: STATUS_TERMINAL,
  },
  phases: TAREAS_TAB_PHASES,
  controls: TAREAS_TAB_CONTROLS,
  delivery: TAREAS_TAB_DELIVERY,
  modes: TAREAS_TAB_MODES,
  retiredAliases: RETIRED_ALIASES,
} as const;
