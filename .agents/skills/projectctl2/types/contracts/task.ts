import { z } from 'zod';
import { NavigationCriterionSchema, NonEmptyTextSchema, uniqueStringArray } from './shared.ts';
import { WorkflowPhaseIds } from './workflow.ts';

/** TaskAppMapTarget = "" | { view: { id: NonEmptyText; name: NonEmptyText }; feature: { name: NonEmptyText } }. */
export const TaskAppMapTargetSchema = z.union([
  z.literal(''),
  z.strictObject({
  view: z.strictObject({ id: NonEmptyTextSchema.meta({ description: 'Target view identifier.' }), name: NonEmptyTextSchema.meta({ description: 'Target view name.' }) }).meta({ description: 'View containing the task scope.' }),
  feature: z.strictObject({ name: NonEmptyTextSchema.meta({ description: 'Target feature name.' }) }).meta({ description: 'Feature containing the task scope.' }),
  }),
]).meta({ title: 'TaskAppMapTarget', description: 'Task location in the App Map, or empty when unscoped.' });

/** NewCriterionOperation { operation: "new"; criterion: NavigationCriterion }. */
export const NewCriterionOperationSchema = z.strictObject({
  operation: z.literal('new').meta({ description: 'Add a criterion to navigation.' }),
  criterion: NavigationCriterionSchema.meta({ description: 'Criterion definition to add.' }),
}).meta({ title: 'NewCriterionOperation', description: 'Add a criterion to the navigation hierarchy.' });
/** EditCriterionOperation { operation: "edit"; criterion: NavigationCriterion }. */
export const EditCriterionOperationSchema = z.strictObject({
  operation: z.literal('edit').meta({ description: 'Update an existing navigation criterion.' }),
  criterion: NavigationCriterionSchema.meta({ description: 'Replacement criterion definition.' }),
}).meta({ title: 'EditCriterionOperation', description: 'Replace an existing navigation criterion.' });
/** DeleteCriterionOperation { operation: "delete"; id: NonEmptyText }. */
export const DeleteCriterionOperationSchema = z.strictObject({
  operation: z.literal('delete').meta({ description: 'Remove a navigation criterion.' }),
  id: NonEmptyTextSchema.meta({ description: 'Identifier of the criterion to remove.' }),
}).meta({ title: 'DeleteCriterionOperation', description: 'Remove a criterion by identifier.' });

/** TaskCriterionOperation = NewCriterionOperation | EditCriterionOperation | DeleteCriterionOperation. */
export const TaskCriterionOperationSchema = z.discriminatedUnion('operation', [
  NewCriterionOperationSchema,
  EditCriterionOperationSchema,
  DeleteCriterionOperationSchema,
]).meta({ title: 'TaskCriterionOperation' });

/**
 * TaskDocument {
 *   task_id: string (regex ^\\d{8}-[a-z0-9]{4,8}$);
 *   task_slug: string (lowercase hyphenated slug);
 *   task_name: NonEmptyText;
 *   current_problem: NonEmptyText;
 *   ui_url: string;
 *   skills: unique NonEmptyText[];
 *   app_map: "" | { view: { id: NonEmptyText; name: NonEmptyText }; feature: { name: NonEmptyText } };
 *   expected: string;
 *   criteria: TaskCriterionOperation[];
 *   source_branch: NonEmptyText;
 *   branch: string;
 *   pr: string;
 *   phase: WorkflowPhaseIds enum;
 *   state: string (regex ^[a-z][a-z0-9_]*$);
 *   proposal_state: "not-init" | "rejected" | "approve";
 *   functional_state: "not-init" | "rejected" | "approve";
 *   requirements_fix: boolean (default false);
 * }.
 */
export const TaskDocumentSchema = z.strictObject({
  task_id: z.string().regex(/^\d{8}-[a-z0-9]{4,8}$/).meta({ description: 'Unique task identifier in date-suffix format.' }),
  task_slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).meta({ description: 'URL- and path-safe task name.' }),
  task_name: NonEmptyTextSchema.meta({ description: 'Human-readable task title.' }),
  current_problem: NonEmptyTextSchema.meta({ description: 'Problem or need this task addresses.' }),
  ui_url: z.string().meta({ description: 'Optional URL to the relevant interface or reference.' }),
  skills: uniqueStringArray(NonEmptyTextSchema).meta({ description: 'Skills relevant to completing this task.' }),
  app_map: TaskAppMapTargetSchema.meta({ description: 'App Map view and feature in scope, or an empty string when none applies.' }),
  expected: z.string().meta({ description: 'Expected outcome or completion evidence.' }),
  criteria: z.array(TaskCriterionOperationSchema).meta({ description: 'Planned navigation criterion additions, edits, or removals.' }),
  source_branch: NonEmptyTextSchema.meta({ description: 'Branch from which task work begins.' }),
  branch: z.string().meta({ description: 'Task working branch, when assigned.' }),
  pr: z.string().meta({ description: 'Pull request reference, when available.' }),
  phase: z.enum(WorkflowPhaseIds).meta({ description: 'Current SDD workflow phase.' }),
  state: z.string().regex(/^[a-z][a-z0-9_]*$/).meta({ description: 'Current state within the workflow phase.' }),
  proposal_state: z.enum(['not-init', 'rejected', 'approve']).meta({ description: 'Acceptance status of the task proposal.' }),
  functional_state: z.enum(['not-init', 'rejected', 'approve']).meta({ description: 'Acceptance status of the implemented functionality.' }),
  requirements_fix: z.boolean().meta({ description: 'Run req-fixer gates in Fase 3 and Fase 4 when true; skip both when false.' }).default(false),
}).meta({
  id: 'urn:projectctl2:schema:task:v1',
  title: 'TaskDocument',
  description: 'Complete Task SDD frontmatter document. App Map correspondence and phase-transition rules remain semantic checks.',
});
export type TaskDocument = z.infer<typeof TaskDocumentSchema>;
