import semver from "semver";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

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
      reportError({
        title: "Missing",
        info: `should satisfies "${range}"`,
        dependency: { name: depKey, origin: type },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        reportError({
          title: "Invalid",
          info: `"${version}" should satisfies "${range}"`,
          dependency: { name: depKey, origin: type },
          onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
        });
      }
    }
  });
}
