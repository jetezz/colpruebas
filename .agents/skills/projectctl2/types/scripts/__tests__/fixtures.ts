export const valid = {
  navigation: { schema_version: 1, views: [{ id: 'home', name: 'Home', features: [{ name: 'Search', criteria: [{ id: 'AC-1', description: 'Find records', type: 'frontend' }] }] }] },
  'test-view': { schema_version: 1, features: [{ name: 'Search', criteria: [{ id: 'AC-1', test: { type: 'UNIT', status: 'verde' } }] }] },
  'criteria-map': { schema_version: 1, type: 'frontend', views: [{ id: 'home', features: [{ name: 'Search', criteria: [{ id: 'AC-1', paths: ['src/search.ts'] }] }] }] },
  task: { task_id: '20261010-abcd', task_slug: 'contract-check', task_name: 'Contract check', current_problem: 'Contracts can drift', ui_url: '', skills: ['sdd'], app_map: '', expected: '', criteria: [{ operation: 'new', criterion: { id: 'AC-2', description: 'Check contracts', type: 'tooling' } }], source_branch: 'develop', branch: '', pr: '', phase: 'fase_1_propuesta', state: 'p1_started', proposal_state: 'not-init', functional_state: 'not-init', requirements_fix: false },
  'phase-definition': { id: 'fase_1_propuesta', states: ['p1_started', 'p1_exploring'] },
  'state-definition': { phase: 'fase_1_propuesta', state: 'p1_started' },
} as const;

export const invalid: Record<keyof typeof valid, unknown> = {
  navigation: { schema_version: 1, views: [{ id: 'home', name: 'Home', features: [{ name: 'Search', criteria: [{ id: 'AC-1', description: 'Find records', type: 'bogus' }] }] }] },
  'test-view': { schema_version: 1, features: [{ name: 'Search', criteria: [{ id: 'AC-1', test: { type: 'E2E', status: 'verde' } }] }] },
  'criteria-map': { schema_version: 1, type: 'unknown', views: [] },
  task: { ...valid.task, task_id: 'bad' },
  'phase-definition': { id: 'fase_1_propuesta', states: ['p1_started', 'p1_started'] },
  'state-definition': { phase: 'fase_1_propuesta', state: 'p2_planning' },
};
