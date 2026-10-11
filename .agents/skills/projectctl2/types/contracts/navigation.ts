import { z } from 'zod';
import { NavigationCriterionSchema, NonEmptyTextSchema } from './shared.ts';

export { NavigationCriterionSchema };
export type { NavigationCriterion } from './shared.ts';

/**
 * NavigationFeature {
 *   name: NonEmptyText;
 *   criteria: NavigationCriterion[];
 * }
 * NavigationCriterion { id: NonEmptyText; description: NonEmptyText; type: CriterionType }
 * CriterionType = 'frontend' | 'backend' | 'data' | 'tooling' | 'utils'
 */
export const NavigationFeatureSchema = z.strictObject({
  name: NonEmptyTextSchema.meta({ description: 'Feature name within the view.' }),
  criteria: z.array(NavigationCriterionSchema).meta({ description: 'Acceptance criteria belonging to this feature.' }),
}).meta({ title: 'NavigationFeature', description: 'A named feature and its acceptance criteria.' });

/**
 * NavigationView {
 *   id: NonEmptyText;
 *   name: NonEmptyText;
 *   features: NavigationFeature[];
 * }
 */
export const NavigationViewSchema = z.strictObject({
  id: NonEmptyTextSchema.meta({ description: 'Stable view identifier used in documentation paths.' }),
  name: NonEmptyTextSchema.meta({ description: 'Human-readable view name.' }),
  features: z.array(NavigationFeatureSchema).min(1).meta({ description: 'Features available in this view.' }),
}).meta({ title: 'NavigationView', description: 'A view and its feature hierarchy.' });

/**
 * NavigationDocument {
 *   schema_version: 1;
 *   views: NavigationView[];
 * }
 */
export const NavigationDocumentSchema = z.strictObject({
  schema_version: z.literal(1).meta({ description: 'Navigation contract format version.' }),
  views: z.array(NavigationViewSchema).meta({ description: 'Views and their features and criteria.' }),
}).meta({
  id: 'urn:projectctl2:schema:navigation:v1',
  title: 'NavigationDocument',
  description: 'Canonical view-feature-criterion hierarchy parsed from docs/app-map/navigation.yaml.',
});
export type NavigationDocument = z.infer<typeof NavigationDocumentSchema>;
