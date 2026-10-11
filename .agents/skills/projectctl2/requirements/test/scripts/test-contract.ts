import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { z } from 'zod';
import { NonEmptyTextSchema, type NavigationCriterion } from '../../../types/contracts/shared.ts';
import { NavigationFeatureSchema, NavigationViewSchema } from '../../../types/contracts/navigation.ts';
import { TestRecordSchema } from '../../../types/contracts/test-view.ts';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import { slugify } from '../../../types/scripts/slugify.ts';

export type Dict = Record<string, unknown>;
export type Issue = { path: string; message: string };
/** Canonical navigation criterion (shared.ts `NavigationCriterion`, with `CriterionType`). */
export type Criterion = NavigationCriterion;
/** Canonical navigation feature (navigation.ts `NavigationFeatureSchema`). */
export type Feature = z.infer<typeof NavigationFeatureSchema>;
/**
 * Canonical navigation view (navigation.ts `NavigationViewSchema`) plus locally derived `slug`.
 * `slug` is derived from `id` via `slug()` and resolves the per-view test file.
 */
export type View = z.infer<typeof NavigationViewSchema> & { slug: string };

/**
 * Types/statuses derived from the canonical schema (test-view.ts `TestRecordSchema`).
 * Kept as `Set` for compatibility with CLI consumers (`update-test-status.ts`).
 */
export const TEST_TYPES = new Set<string>(TestRecordSchema.shape.type.options);
export const TEST_STATUSES = new Set<string>(TestRecordSchema.shape.status.options);

export const isDict = (value: unknown): value is Dict => value !== null && typeof value === 'object' && !Array.isArray(value);
export const isText = (value: unknown): value is string => NonEmptyTextSchema.safeParse(value).success;

export function slug(value: string): string {
  return slugify(value);
}

export function loadNavigation(root: string): View[] {
  const file = resolve(root, 'docs/app-map/navigation.yaml');
  const document = Bun.YAML.parse(readFileSync(file, 'utf8'));
  const validation = validateDocument('navigation', document);
  if (!validation.valid) throw new Error(validation.issues.map(issue => `${issue.path}: ${issue.message}`).join('; '));
  // Shape (schema_version, types, fields) already validated by `validateDocument('navigation')`.
  // Only semantic checks the schema does NOT cover here: duplicates, collisions, and slugs.
  const navigation = validation.data;
  const views: View[] = [];
  const viewIds = new Set<string>();
  const criterionIds = new Set<string>();
  for (const [vi, rawView] of navigation.views.entries()) {
    const at = `navigation.yaml.views[${vi}]`;
    if (viewIds.has(rawView.id)) throw new Error(`${at}.id: duplicate view ID ${rawView.id}`);
    viewIds.add(rawView.id);
    const viewSlug = slug(rawView.id);
    if (!viewSlug) throw new Error(`${at}.id: ID does not produce a valid slug`);
    const features: Feature[] = [];
    const featureNames = new Set<string>();
    for (const [fi, rawFeature] of rawView.features.entries()) {
      const fpath = `${at}.features[${fi}]`;
      if (featureNames.has(rawFeature.name)) throw new Error(`${fpath}.name: duplicate feature name ${rawFeature.name} in view ${rawView.id}`);
      featureNames.add(rawFeature.name);
      if (!slug(rawFeature.name)) throw new Error(`${fpath}.name: name does not produce a valid slug`);
      const criteria: Criterion[] = [];
      for (const [ci, rawCriterion] of rawFeature.criteria.entries()) {
        const cpath = `${fpath}.criteria[${ci}]`;
        if (criterionIds.has(rawCriterion.id)) throw new Error(`${cpath}.id: duplicate criterion ID ${rawCriterion.id}`);
        criterionIds.add(rawCriterion.id);
        if (viewIds.has(rawCriterion.id)) throw new Error(`${cpath}.id: criterion ID collides with a view ID: ${rawCriterion.id}`);
        const criterionSlug = slug(rawCriterion.id);
        if (!criterionSlug) throw new Error(`${cpath}.id: ID does not produce a valid slug`);
        criteria.push({ id: rawCriterion.id, description: rawCriterion.description, type: rawCriterion.type });
      }
      features.push({ name: rawFeature.name, criteria });
    }
    views.push({ id: rawView.id, name: rawView.name, features, slug: viewSlug });
  }
  for (const view of views) {
    for (const feature of view.features) {
      for (const criterion of feature.criteria) {
        if (viewIds.has(criterion.id)) throw new Error(`criterion ID collides with a view ID: ${criterion.id}`);
      }
    }
  }
  return views;
}

export function validateViewTestData(view: View, data: unknown, testPath: string): Issue[] {
  const validation = validateDocument('test-view', data);
  const issues: Issue[] = validation.issues.map(issue => ({ path: `${testPath}${issue.path.slice(1)}`, message: issue.message }));
  // Shape (schema_version, types, statuses, fields) already validated by `validateDocument('test-view')`.
  // Only semantic checks the schema does NOT cover here: duplicates and navigation-test correspondence.
  const source: unknown = validation.valid ? validation.data : data;
  if (!isDict(source) || !Array.isArray(source.features)) {
    return issues;
  }
  const expectedFeatures = new Map(view.features.map(feature => [feature.name, feature]));
  const seenFeatures = new Set<string>();
  for (const [fi, rawFeature] of (source.features as unknown[]).entries()) {
    const fpath = `${testPath}.features[${fi}]`;
    if (!isDict(rawFeature) || !isText(rawFeature.name) || !Array.isArray(rawFeature.criteria)) {
      continue;
    }
    const featureName = rawFeature.name;
    const criteriaRaw = rawFeature.criteria as unknown[];
    if (seenFeatures.has(featureName)) issues.push({ path: `${fpath}.name`, message: `duplicate feature: ${featureName}` });
    seenFeatures.add(featureName);
    const expectedFeature = expectedFeatures.get(featureName);
    if (!expectedFeature) {
      issues.push({ path: `${fpath}.name`, message: `feature is not present in navigation.yaml: ${featureName}` });
      continue;
    }

    const expectedCriteria = new Map(expectedFeature.criteria.map(criterion => [criterion.id, criterion]));
    const seenCriteria = new Set<string>();
    for (const [ci, rawCriterion] of criteriaRaw.entries()) {
      const cpath = `${fpath}.criteria[${ci}]`;
      if (!isDict(rawCriterion) || !isText(rawCriterion.id)) {
        continue;
      }
      const criterionId = rawCriterion.id;
      if (seenCriteria.has(criterionId)) issues.push({ path: `${cpath}.id`, message: `duplicate criterion ID: ${criterionId}` });
      seenCriteria.add(criterionId);
      const expectedCriterion = expectedCriteria.get(criterionId);
      if (!expectedCriterion) issues.push({ path: `${cpath}.id`, message: `criterion is not present in this feature in navigation.yaml: ${criterionId}` });
    }
    for (const id of expectedCriteria.keys()) if (!seenCriteria.has(id)) issues.push({ path: `${fpath}.criteria`, message: `missing criterion from navigation.yaml: ${id}` });
  }
  for (const name of expectedFeatures.keys()) if (!seenFeatures.has(name)) issues.push({ path: `${testPath}.features`, message: `missing feature from navigation.yaml: ${name}` });
  return issues;
}

export function testFile(root: string, view: View): string {
  return join(resolve(root, 'docs/app-map'), view.slug, `${view.slug}.yaml`);
}

export function readYaml(file: string): unknown {
  return Bun.YAML.parse(readFileSync(file, 'utf8'));
}
