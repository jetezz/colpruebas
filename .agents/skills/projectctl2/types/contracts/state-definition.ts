import { z } from 'zod';
import { WorkflowCatalog, type WorkflowPhaseId } from './workflow.ts';

const stateBranch = <P extends WorkflowPhaseId>(phase: P) => z.strictObject({
  phase: z.literal(phase).meta({ description: 'Workflow phase containing the state.' }),
  state: z.enum(WorkflowCatalog[phase]).meta({ description: 'Current workflow state within the phase.' }),
}).meta({ description: `State selection for workflow phase ${phase}.` });

/**
 * Discriminated union keyed by `phase`; each `state` is drawn from that
 * phase's state enum in {@link WorkflowCatalog}.
 *
 * ```ts
 * type StateDefinition =
 *   | { phase: 'fase_1_propuesta'; state: (typeof WorkflowCatalog.fase_1_propuesta)[number] }
 *   | { phase: 'fase_2_implementacion'; state: (typeof WorkflowCatalog.fase_2_implementacion)[number] }
 *   | { phase: 'fase_3_verificacion'; state: (typeof WorkflowCatalog.fase_3_verificacion)[number] }
 *   | { phase: 'fase_4_documentacion'; state: (typeof WorkflowCatalog.fase_4_documentacion)[number] };
 * ```
 */
export const StateDefinitionSchema = z.discriminatedUnion('phase', [
  stateBranch('fase_1_propuesta'),
  stateBranch('fase_2_implementacion'),
  stateBranch('fase_3_verificacion'),
  stateBranch('fase_4_documentacion'),
]).meta({ id: 'urn:projectctl2:schema:state-definition:v1', title: 'StateDefinition' });
export type StateDefinition = z.infer<typeof StateDefinitionSchema>;
