import semver from "semver";
import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";

export interface CheckSatisfiesVersionsOptions {
  customCreateReportError?: typeof createReportError;
}

export function checkSatisfiesVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  dependenciesRanges: Record<string, string>,
  onlyWarnsForCheck?: OnlyWarnsForCheck,
  {
    customCreateReportError = createReportError,
  }: CheckSatisfiesVersionsOptions = {},
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError(
    "Satisfies Versions",
    pkgPathName,
  );

  Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `should satisfies "${range}".`,
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
          `"${version}" (in "${depKey}") should satisfies "${range}".`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey),
        );
      }
    }
  });
}
