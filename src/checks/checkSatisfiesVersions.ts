import semver from "semver";
import { createReportError } from "../utils/createReportError.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export interface CheckSatisfiesVersionsOptions {
  customCreateReportError?: typeof createReportError;
}

export function checkSatisfiesVersions(
  pkg: ParsedPackageJson,
  type: DependencyTypes,
  dependenciesRanges: Record<string, string>,
  onlyWarnsForCheck?: OnlyWarnsForCheck,
  {
    customCreateReportError = createReportError,
  }: CheckSatisfiesVersionsOptions = {},
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError("Satisfies Versions", pkg.path);

  Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
    const pkgRange = pkgDependencies[depKey];

    if (!pkgRange?.value) {
      reportError({
        errorMessage: "Missing",
        errorDetails: `should satisfies "${range}"`,
        dependency: { name: depKey, fieldName: type },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
    } else {
      const minVersionOfVersion = semver.minVersion(pkgRange.value);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        reportError({
          errorMessage: "Invalid",
          errorDetails: `"${pkgRange.value}" should satisfies "${range}"`,
          dependency: pkgRange,
          onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
        });
      }
    }
  });
}
