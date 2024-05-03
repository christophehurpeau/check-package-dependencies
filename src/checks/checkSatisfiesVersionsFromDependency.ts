import semver from 'semver';
import { createReportError } from '../utils/createReportError';
import type { DependencyTypes, PackageJson } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

export interface CheckSatisfiesVersionsFromDependencyOptions {
  tryToAutoFix?: boolean;
  onlyWarnsForCheck?: OnlyWarnsForCheck;
  customCreateReportError?: typeof createReportError;
}

export function checkSatisfiesVersionsFromDependency(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  depType: DependencyTypes,
  {
    tryToAutoFix,
    onlyWarnsForCheck,
    customCreateReportError = createReportError,
  }: CheckSatisfiesVersionsFromDependencyOptions = {},
): void {
  const pkgDependencies = pkg[type] || {};
  const dependencies = depPkg[depType] || {};

  const reportError = customCreateReportError(
    `Satisfies Versions from "${depPkg.name}"`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];

    if (!range) {
      if (tryToAutoFix) {
      } else {
        reportError(
          `Unexpected missing dependency "${depKey}" in "${depPkg.name}".`,
        );
      }
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
