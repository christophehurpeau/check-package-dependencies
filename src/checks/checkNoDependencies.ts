import { createReportError } from './utils/createReportError';
import type { PackageJson, DependencyTypes } from './utils/packageTypes';

export function checkNoDependencies(
  pkg: PackageJson,
  pkgPath: string,
  type: DependencyTypes = 'dependencies',
  moveToSuggestion: DependencyTypes = 'devDependencies',
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('No dependencies', pkgPath);
  reportError(
    `Unexpected ${type}`,
    `you should move them in ${moveToSuggestion}`,
  );
}
