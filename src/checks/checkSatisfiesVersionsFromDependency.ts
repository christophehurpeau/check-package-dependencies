import { satisfies, minVersion } from 'semver';
import { createReportError } from './utils/createReportError';
import type { DependencyTypes, PackageJson } from './utils/packageTypes';

export function checkSatisfiesVersionsFromDependency(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  dependencies: PackageJson[DependencyTypes] = {},
  onlyWarnsFor: string[] = [],
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError(
    `Satisfies Versions from ${depPkg.name}`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];
    if (!range) {
      throw new Error(
        `Unexpected missing dependency range in "${depPkg.name}" for "${depKey}".`,
      );
    }

    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
        onlyWarnsFor.includes(depKey),
      );
    } else {
      const minVersionOfVersion = minVersion(version);
      if (!minVersionOfVersion || !satisfies(minVersionOfVersion, range)) {
        reportError(
          `Invalid "${depKey}" in ${type}`,
          `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
          onlyWarnsFor.includes(depKey),
        );
      }
    }
  });
}
