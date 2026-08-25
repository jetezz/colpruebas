/**
 * AUTO-GENERATED from projectctl-requirements task-flow-binding v9.0.0 — do not edit by hand.
 *
 * Source block: `<!-- task-flow-binding:start -->` fenced JSON in
 * `.agents/skills/projectctl-requirements/references/tareas.md`.
 *
 * This file is a derived client projection (non-authoritative) of the binding. The
 * canonical source of truth is the delimited `task-flow-binding` block. Regenerate with
 * `taskflow:generate` after editing the binding; do not edit manually.
 */
export const TASK_FLOW_BINDING = {
  binding_id: 'projectctl-requirements.task-flow',
  binding_version: '9.0.0',
  model_version: 1,
} as const;

export type TaskFlowWorkflowStatus =
  | 'pending'
  | 'planning'
  | 'implementing'
  | 'testing'
  | 'documenting'
  | 'done'
  | 'blocked'
  | 'failed';

export const STATUS_WRITABLE: readonly TaskFlowWorkflowStatus[] = [
  'pending',
  'planning',
  'implementing',
  'testing',
  'documenting',
  'done',
  'blocked',
  'failed',
] as const;

export const STATUS_PRE_BOOTSTRAP: TaskFlowWorkflowStatus = 'pending';

export const STATUS_TERMINAL: TaskFlowWorkflowStatus = 'done';

export interface TaskFlowPhase {
  id: string;
  status: TaskFlowWorkflowStatus;
  states: readonly string[];
  allowedLanes: readonly string[];
  transitions: readonly TaskFlowTransition[];
}

export interface TaskFlowTransition {
  from: string;
  to: string;
  guard?: string;
}

export const PHASES: readonly TaskFlowPhase[] = [
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

export type TaskFlowControlKind = 'action' | 'outcome' | 'terminal';

export interface TaskFlowControl {
  id: string;
  kind: TaskFlowControlKind;
  writesState: boolean;
  owner: string;
  value?: {
    phase: string | null;
    state: string;
    status: TaskFlowWorkflowStatus;
  };
  status?: TaskFlowWorkflowStatus;
  preserves?: readonly string[];
  transitions: readonly TaskFlowTransition[];
}

export const CONTROLS: readonly TaskFlowControl[] = [
  {
    id: 'branch_creation_pending',
    kind: 'action',
    writesState: true,
    owner: 'coordinator',
    value: { phase: 'fase_1_propuesta', state: 'branch_creation_pending', status: 'planning' },
    transitions: [
      { id: 'branch_creation_pending_to_p2_planning', from: 'branch_creation_pending', to: 'p2_planning', guard: 'AC-010.passed_and_branch_available' },
    ],
  },
  {
    id: 'final_commit_pending',
    kind: 'action',
    writesState: true,
    owner: 'coordinator',
    value: { phase: 'fase_4_documentacion', state: 'final_commit_pending', status: 'documenting' },
    transitions: [
      { id: 'final_commit_pending_to_final_push_pending', from: 'final_commit_pending', to: 'final_push_pending', guard: 'commit_recorded' },
      { id: 'final_commit_pending_code_review_reentry', from: 'final_commit_pending', to: 'p2_revision_requested', guard: 'code_review_failed' },
    ],
  },
  {
    id: 'final_push_pending',
    kind: 'action',
    writesState: true,
    owner: 'coordinator',
    value: { phase: 'fase_4_documentacion', state: 'final_push_pending', status: 'documenting' },
    transitions: [
      { id: 'final_push_pending_to_final_pr_pending', from: 'final_push_pending', to: 'final_pr_pending', guard: 'push_recorded' },
    ],
  },
  {
    id: 'final_pr_pending',
    kind: 'action',
    writesState: true,
    owner: 'coordinator',
    value: { phase: 'fase_4_documentacion', state: 'final_pr_pending', status: 'documenting' },
    transitions: [
      { id: 'final_pr_pending_to_done', from: 'final_pr_pending', to: 'done', guard: 'pr_url_recorded' },
    ],
  },
  {
    id: 'done',
    kind: 'terminal',
    writesState: true,
    owner: 'coordinator',
    value: { phase: null, state: 'done', status: 'done' },
    transitions: [],
  },
  {
    id: 'blocked',
    kind: 'outcome',
    writesState: false,
    owner: 'coordinator',
    status: 'blocked',
    preserves: ['phase', 'state'],
    transitions: [],
  },
  {
    id: 'failed',
    kind: 'outcome',
    writesState: false,
    owner: 'coordinator',
    status: 'failed',
    preserves: ['phase', 'state'],
    transitions: [],
  },
] as const;

export const DELIVERY = {
  sourceBranch: 'develop',
  targetBranch: 'develop',
  branchPattern: 'feature/<task_id>-<task_slug>',
  actionOrder: ['final_commit_pending', 'final_push_pending', 'final_pr_pending', 'done'],
} as const;

export const RETIRED_ALIASES: readonly string[] = [
  'ready_for_branch',
  'branching',
  'pushing',
  'verified',
  'phase1_generating',
  'phase2_branching',
  'phase3_implementing',
  'phase4_pushing',
  'completed',
  'paused',
  'sdd-apply',
  'sdd-apply-code',
  'sdd-explore',
  'sdd-verify',
  'sdd-browser-runtime-context',
  'sdd/<sdd_change_id>/<artifact>',
  '3_vinculacion_sdd_del_cambio',
  '4_resumen_de_exploracion',
  '5_proposal',
  '6_specs_delta_requirements',
  '7_design_decisions',
  '8_alcance_y_superficies_afectadas',
  '10_desglose_de_implementacion_progreso_sdd',
  '11_archivos_previstos_modificados',
  '12_impacto_backend',
  '13_validacion_requerida',
  '14_resultado_de_ejecucion',
  '15_resumen_de_verificacion_sdd',
  '16_archive_cierre_sdd',
  '17_problemas_encontrados',
  '18_git_y_pr',
  '19_documentacion_actualizada',
  '20_resumen_de_ejecucion',
  '21_historial_de_cambios_de_la_task',
] as const;
