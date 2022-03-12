import semver from 'semver';
import { createReportError } from '../utils/createReportError';
import type { DependencyTypes, PackageJson } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

export function checkSatisfiesVersionsFromDependency(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  dependencies: PackageJson[DependencyTypes] = {},
  onlyWarnsForCheck?: OnlyWarnsForCheck,
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError(
    `Satisfies Versions from ${depPkg.name}`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];
    if (!range) {
      reportError(
        `Unexpected missing dependency "${depKey}" in "${depPkg.name}".`,
      );
      return;
    }

    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
        onlyWarnsForCheck?.shouldWarnsFor(depKey),
      );
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        reportError(
          `Invalid "${depKey}" in ${type}`,
          `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey),
        );
      }
    }
  });
}
