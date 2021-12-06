import { createReportError } from '../utils/createReportError';
import { getKeys } from '../utils/object';
import type { DependencyTypes, PackageJson } from '../utils/packageTypes';

export function checkIdenticalVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  deps: Record<string, string[] | Partial<Record<DependencyTypes, string[]>>>,
  onlyWarnsFor: string[] = [],
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError('Identical Versions', pkgPathName);

  getKeys(deps).forEach((depKey) => {
    const version = pkgDependencies[depKey];
    if (!version) {
      reportError(`Unexpected missing ${type} for "${depKey}".`);
      return;
    }

    const depConfigArrayOrObject = deps[depKey];
    const depConfig = Array.isArray(depConfigArrayOrObject)
      ? { [type]: depConfigArrayOrObject }
      : depConfigArrayOrObject;

    getKeys(depConfig).forEach((depKeyType) => {
      const pkgDependenciesType = pkg[depKeyType] || {};
      depConfig[depKeyType]?.forEach((depKeyIdentical) => {
        const value = pkgDependenciesType[depKeyIdentical];
        if (!value) {
          reportError(
            `Missing "${depKeyIdentical}" in ${depKeyType}`,
            `it should be "${version}".`,
            onlyWarnsFor.includes(depKey),
          );
        }

        if (value !== version) {
          reportError(
            `Invalid "${depKeyIdentical}" in ${depKeyType}`,
            `expecting "${value}" be "${version}".`,
            onlyWarnsFor.includes(depKey),
          );
        }
      });
    });
  });
}
