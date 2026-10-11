import { z } from 'zod';
import { NonEmptyTextSchema } from './shared.ts';

/**
 * TestRecord {
 *   type: 'PW-AUTO' | 'UNIT'
 *   status: 'sin-test' | 'rojo' | 'verde'
 * }
 */
export const TestRecordSchema = z.strictObject({
  type: z.enum(['PW-AUTO', 'UNIT']).meta({ description: 'Test execution kind for the criterion.' }),
  status: z.enum(['sin-test', 'rojo', 'verde']).meta({ description: 'Current test status: not tested, failing, or passing.' }),
}).meta({ title: 'TestRecord', description: 'Test classification and execution status.' });

/**
 * TestCriterion {
 *   id: NonEmptyText
 *   test: TestRecord
 * }
 */
export const TestCriterionSchema = z.strictObject({
  id: NonEmptyTextSchema.meta({ description: 'Criterion identifier matching navigation.' }),
  test: TestRecordSchema.meta({ description: 'Test kind and current status.' }),
}).meta({ title: 'TestCriterion', description: 'Test record associated with one criterion.' });

/**
 * TestFeature {
 *   name: NonEmptyText
 *   criteria: TestCriterion[]
 * }
 */
export const TestFeatureSchema = z.strictObject({
  name: NonEmptyTextSchema.meta({ description: 'Feature name matching navigation.' }),
  criteria: z.array(TestCriterionSchema).meta({ description: 'Test records for this feature\'s criteria.' }),
}).meta({ title: 'TestFeature', description: 'Feature and its criterion test records.' });

/**
 * TestViewDocument {
 *   schema_version: 1
 *   features: TestFeature[]
 * }
 */
export const TestViewDocumentSchema = z.strictObject({
  schema_version: z.literal(1).meta({ description: 'Test record format version.' }),
  features: z.array(TestFeatureSchema).meta({ description: 'Features and their criterion test records for the view.' }),
}).meta({
  id: 'urn:projectctl2:schema:test-view:v1',
  title: 'TestViewDocument',
  description: 'Test-type and test-status records for one view, parsed from its App Map YAML file.',
});
export type TestViewDocument = z.infer<typeof TestViewDocumentSchema>;
