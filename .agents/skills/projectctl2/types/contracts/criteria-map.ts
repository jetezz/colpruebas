import { z } from 'zod';
import { CriterionTypeSchema, NonEmptyTextSchema } from './shared.ts';

/** CriteriaMapCriterion { id: NonEmptyText, paths: NonEmptyText[] } */
export const CriteriaMapCriterionSchema = z.strictObject({
  id: NonEmptyTextSchema.meta({ description: 'Criterion identifier matching navigation.' }),
  paths: z.array(NonEmptyTextSchema.meta({ description: 'Project-relative implementation path.' })).meta({ description: 'Implementation paths associated with the criterion.' }),
}).meta({ title: 'CriteriaMapCriterion', description: 'Criterion and its implementation paths.' });

/** CriteriaMapFeature { name: NonEmptyText, criteria: CriteriaMapCriterion[] } */
export const CriteriaMapFeatureSchema = z.strictObject({
  name: NonEmptyTextSchema.meta({ description: 'Feature name matching navigation.' }),
  criteria: z.array(CriteriaMapCriterionSchema).meta({ description: 'Criteria of this feature mapped to implementation paths.' }),
}).meta({ title: 'CriteriaMapFeature', description: 'Feature and its path-mapped criteria.' });

/** CriteriaMapView { id: NonEmptyText, features: CriteriaMapFeature[] } */
export const CriteriaMapViewSchema = z.strictObject({
  id: NonEmptyTextSchema.meta({ description: 'View identifier matching navigation.' }),
  features: z.array(CriteriaMapFeatureSchema).meta({ description: 'Features and mapped criteria for this view.' }),
}).meta({ title: 'CriteriaMapView', description: 'View and its feature mappings.' });

/** CriteriaMapDocument { schema_version: 1, type: 'frontend' | 'backend' | 'data' | 'tooling' | 'utils', views: CriteriaMapView[] } */
export const CriteriaMapDocumentSchema = z.strictObject({
  schema_version: z.literal(1).meta({ description: 'Criteria map format version.' }),
  type: CriterionTypeSchema,
  views: z.array(CriteriaMapViewSchema).meta({ description: 'Views represented in this implementation-area map.' }),
}).meta({
  id: 'urn:projectctl2:schema:criteria-map:v1',
  title: 'CriteriaMapDocument',
  description: 'A per-type projection of navigation criteria with project-relative implementation paths.',
});
export type CriteriaMapDocument = z.infer<typeof CriteriaMapDocumentSchema>;
