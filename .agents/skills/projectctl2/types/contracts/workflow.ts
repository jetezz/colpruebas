/**
 * Canonical ordered phase/state catalog for the SDD Task workflow.
 * Each phase maps to its ordered array of workflow states.
 */
export const WorkflowCatalog = {
  fase_1_propuesta: ['p1_started', 'p1_exploring', 'p1_awaiting_acceptance'],
  fase_2_implementacion: ['p2_planning', 'p2_implementing', 'p2_code_review', 'p2_awaiting_acceptance'],
  fase_3_verificacion: ['p3_test_preparing', 'p3_test_running', 'p3_requirements'],
  fase_4_documentacion: ['p4_documenting', 'p4_requirements_docs', 'p4_done'],
} as const;

export const WorkflowPhaseIds = Object.keys(WorkflowCatalog) as Array<keyof typeof WorkflowCatalog>;
/** Union of phase IDs derived from the keys of {@link WorkflowCatalog}. */
export type WorkflowPhaseId = keyof typeof WorkflowCatalog;
/** Union of workflow states derived from the catalog's phase arrays. */
export type WorkflowState = (typeof WorkflowCatalog)[WorkflowPhaseId][number];
