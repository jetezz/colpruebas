import { z } from 'zod';

/** NonEmptyTextSchema: string with at least one non-whitespace character. */
export const NonEmptyTextSchema = z.string().min(1).regex(/\S/).meta({ title: 'NonEmptyText', description: 'Non-blank text value.' });
/** NonEmptyText: inferred TypeScript type for NonEmptyTextSchema (`string`). */
export type NonEmptyText = z.infer<typeof NonEmptyTextSchema>;

/**
 * Builds an array schema whose string items must be unique.
 *
 * JSON Schema `uniqueItems` compares array values structurally, while JavaScript
 * Set compares objects by identity. Keep this helper string-only so its runtime
 * duplicate check agrees with the exported JSON Schema contract.
 */
export function uniqueStringArray<T extends z.ZodType<string>>(itemSchema: T) {
  return z.array(itemSchema)
    .refine(items => new Set(items).size === items.length, 'must contain unique items')
    .meta({ uniqueItems: true });
}

/** CriterionTypeSchema { 'frontend' | 'backend' | 'data' | 'tooling' | 'utils' } */
export const CriterionTypeSchema = z.enum(['frontend', 'backend', 'data', 'tooling', 'utils']).meta({ description: 'Implementation area responsible for the criterion.' });
/** CriterionType { 'frontend' | 'backend' | 'data' | 'tooling' | 'utils' } */
export type CriterionType = z.infer<typeof CriterionTypeSchema>;

/** NavigationCriterionSchema { id: NonEmptyText; description: NonEmptyText; type: CriterionType } */
export const NavigationCriterionSchema = z.strictObject({
  id: NonEmptyTextSchema.meta({ description: 'Stable criterion identifier.' }),
  description: NonEmptyTextSchema.meta({ description: 'Canonical behavior or acceptance condition.' }),
  type: CriterionTypeSchema,
}).meta({ title: 'NavigationCriterion', description: 'Acceptance criterion with a stable identifier and responsible implementation area.' });
/** NavigationCriterion { id: NonEmptyText; description: NonEmptyText; type: CriterionType } */
export type NavigationCriterion = z.infer<typeof NavigationCriterionSchema>;
