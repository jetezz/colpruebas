import { z } from 'zod';
import { WorkflowCatalog, type WorkflowPhaseId } from './workflow.ts';
import { uniqueStringArray } from './shared.ts';

const phaseBranch = <P extends WorkflowPhaseId>(phase: P) => z.strictObject({
  id: z.literal(phase).meta({ description: 'Workflow phase identifier.' }),
  states: uniqueStringArray(z.enum(WorkflowCatalog[phase]).meta({ description: 'Workflow state identifier.' })).min(1).meta({ description: 'States permitted in this phase, in workflow order.' }),
}).meta({ description: `State definition for workflow phase ${phase}.` });

/**
 * Schema for the discriminated union `PhaseDefinition`:
 *
 * - `{ id: 'fase_1_propuesta'; states: [...] }`
 * - `{ id: 'fase_2_implementacion'; states: [...] }`
 * - `{ id: 'fase_3_verificacion'; states: [...] }`
 * - `{ id: 'fase_4_documentacion'; states: [...] }`
 *
 * In each branch, `states` is a non-empty array of state values from that
 * phase's `WorkflowCatalog` entry. State values must be unique and appear in
 * workflow order.
 */
export const PhaseDefinitionSchema = z.discriminatedUnion('id', [
  phaseBranch('fase_1_propuesta'),
  phaseBranch('fase_2_implementacion'),
  phaseBranch('fase_3_verificacion'),
  phaseBranch('fase_4_documentacion'),
]).meta({ id: 'urn:projectctl2:schema:phase-definition:v1', title: 'PhaseDefinition' });
export type PhaseDefinition = z.infer<typeof PhaseDefinitionSchema>;
