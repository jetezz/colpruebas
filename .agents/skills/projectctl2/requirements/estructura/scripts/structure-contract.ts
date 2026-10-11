import { lstatSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { validateDocument } from '../../../types/scripts/schema-validator.ts';
import type { NavigationDocument, CriteriaMapDocument } from '../../../types/contracts/index.ts';
import { CriterionTypeSchema, NonEmptyTextSchema, type CriterionType } from '../../../types/contracts/shared.ts';

export type Dict = Record<string, unknown>;
export type Issue = { path: string; message: string };
export type MappedPath = { area: string; type: CriterionType; criterionId: string; path: string; sourceFile: string };
export type StructureResult = { issues: Issue[]; paths: MappedPath[] };

export const AREAS = CriterionTypeSchema.options.map(type => ({ directory: type, type }));

const isDict = (value: unknown): value is Dict => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => NonEmptyTextSchema.safeParse(value).success;
const keysAre = (value: object, keys: string[]) => Object.keys(value).every(key => keys.includes(key));

function safeRelativePath(value: string): boolean {
  return value.length > 0 && !value.startsWith('/') && !value.startsWith('\\') &&
    !/^[a-zA-Z]:/.test(value) && !value.includes('\\') && !/[?*\[\]{}]/.test(value) &&
    value.split('/').every(part => part.length > 0 && part !== '.' && part !== '..');
}

export function loadStructure(root: string): StructureResult {
  root = resolve(root);
  const issues: Issue[] = [];
  const paths: MappedPath[] = [];
  const fail = (path: string, message: string) => issues.push({ path, message });
  const navigationFile = join(root, 'docs/app-map/navigation.yaml');

  let navigation: NavigationDocument;
  try {
    const parsed = Bun.YAML.parse(readFileSync(navigationFile, 'utf8'));
    const validation = validateDocument('navigation', parsed);
    if (!validation.valid) {
      for (const issue of validation.issues) fail(`${navigationFile}${issue.path.slice(1)}`, issue.message);
      return { issues, paths };
    }
    navigation = validation.data;
  } catch (error) {
    fail(navigationFile, error instanceof Error ? `could not read valid criteria navigation: ${error.message}` : 'could not read valid criteria navigation');
    return { issues, paths };
  }

  for (const area of AREAS) {
    const directory = join(root, area.directory);
    const mapFile = join(directory, 'criteria-map.yaml');
    let directoryStat;
    try { directoryStat = lstatSync(directory); }
    catch { fail(directory, 'required area directory is missing'); continue; }
    if (directoryStat.isSymbolicLink() || !directoryStat.isDirectory()) {
      fail(directory, 'must be a real directory, not a symlink');
      continue;
    }

    let map: CriteriaMapDocument;
    try {
      const parsed = Bun.YAML.parse(readFileSync(mapFile, 'utf8'));
      const validation = validateDocument('criteria-map', parsed);
      if (!validation.valid) {
        for (const issue of validation.issues) fail(`${mapFile}${issue.path.slice(1)}`, issue.message);
        continue;
      }
      map = validation.data;
    } catch (error) {
      fail(mapFile, error instanceof Error ? `could not read map: ${error.message}` : 'could not read map');
      continue;
    }

    if (map.type !== area.type) fail(`${mapFile}.type`, `must be ${area.type} for the ${area.directory}/ area`);
    const sourceViews = navigation.views;
    if (map.views.length !== sourceViews.length) fail(`${mapFile}.views`, `must contain all ${sourceViews.length} navigation views in order`);

    for (const [viewIndex, rawView] of map.views.entries()) {
      const viewPath = `${mapFile}.views[${viewIndex}]`;
      const expectedView = sourceViews[viewIndex];
      if (rawView.id !== expectedView?.id) fail(`${viewPath}.id`, `must match navigation view at index ${viewIndex}`);
      const sourceFeatures = expectedView?.features ?? [];
      if (rawView.features.length !== sourceFeatures.length) fail(`${viewPath}.features`, `must contain all ${sourceFeatures.length} navigation features in order`);

      for (const [featureIndex, rawFeature] of rawView.features.entries()) {
        const featurePath = `${viewPath}.features[${featureIndex}]`;
        const expectedFeature = sourceFeatures[featureIndex];
        if (rawFeature.name !== expectedFeature?.name) fail(`${featurePath}.name`, `must match navigation feature at index ${featureIndex}`);
        const sourceCriteria = expectedFeature?.criteria ?? [];
        const expectedCriteria = sourceCriteria.filter(criterion => criterion.type === area.type);
        if (rawFeature.criteria.length !== expectedCriteria.length) {
          fail(`${featurePath}.criteria`, `must contain exactly ${expectedCriteria.length} criteria of type ${area.type}`);
        }

        const seenIds = new Set<string>();
        for (const [criterionIndex, rawCriterion] of rawFeature.criteria.entries()) {
          const criterionPath = `${featurePath}.criteria[${criterionIndex}]`;
          const expectedCriterion = expectedCriteria[criterionIndex];
          if (seenIds.has(rawCriterion.id)) fail(`${criterionPath}.id`, `duplicate criterion ID ${rawCriterion.id}`);
          seenIds.add(rawCriterion.id);
          if (rawCriterion.id !== expectedCriterion?.id) {
            fail(`${criterionPath}.id`, `must match the corresponding navigation criterion of type ${area.type}`);
          }
          const seenPaths = new Set<string>();
          for (const [pathIndex, path] of rawCriterion.paths.entries()) {
            const pathAt = `${criterionPath}.paths[${pathIndex}]`;
            if (!isText(path) || !safeRelativePath(path)) {
              fail(pathAt, 'must be a non-empty, safe, project-relative POSIX path without globs');
              continue;
            }
            if (seenPaths.has(path)) fail(pathAt, 'duplicate path for criterion');
            seenPaths.add(path);
            paths.push({ area: area.directory, type: area.type, criterionId: rawCriterion.id, path, sourceFile: mapFile });
          }
        }
      }
    }
  }
  return { issues, paths };
}
