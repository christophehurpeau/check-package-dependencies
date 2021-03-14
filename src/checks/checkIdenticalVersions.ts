import { createReportError } from './utils/createReportError';
import { getKeys } from './utils/object';
import type { DependencyTypes, PackageJson } from './utils/packageTypes';

export function checkIdenticalVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  deps: Record<string, string[]>,
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

    deps[depKey].forEach((depKeyIdentical) => {
      const value = pkgDependencies[depKeyIdentical];
      if (!value) {
        reportError(
          `Missing "${depKeyIdentical}" in ${type}`,
          `it should be "${version}".`,
          onlyWarnsFor.includes(depKey),
        );
      }

      if (value !== version) {
        reportError(
          `Invalid "${depKeyIdentical}" in ${type}`,
          `expecting "${value}" be "${version}".`,
          onlyWarnsFor.includes(depKey),
        );
      }
    });
  });
}
