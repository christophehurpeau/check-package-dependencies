import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import { inDependency } from "../reporting/messages.ts";
import type { Commented } from "../utils/comments.ts";
import { omitComment } from "../utils/comments.ts";
import { getEntries } from "../utils/object.ts";
import type { DependenciesRanges, PackageJson } from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";

export function checkSatisfiesVersionsInDependency(
  reportError: ReportError,
  depPkg: PackageJson,
  dependenciesRangesConfig: Commented & DependenciesRanges,
): void {
  const { comment } = dependenciesRangesConfig;
  // "comment" is not a dependency type, it must not be iterated as one
  const dependenciesRanges = omitComment(dependenciesRangesConfig);
  const commentDetails = comment !== undefined && { comment };

  for (const [dependenciesType, dependenciesTypeRanges] of getEntries(
    dependenciesRanges,
  )) {
    if (!dependenciesTypeRanges) return;
    const dependencies = depPkg[dependenciesType];

    for (const [dependencyName, dependencyRange] of getEntries(
      dependenciesTypeRanges,
    )) {
      if (dependencyRange == null) {
        if (dependencies?.[dependencyName]) {
          reportError({
            errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
            errorDetails: "it should not be present",
            dependency: { name: dependencyName },
            ...commentDetails,
          });
        }
      } else if (!dependencies) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependenciesType}" is missing`,
          dependency: { name: dependencyName },
          ...commentDetails,
        });
      } else if (!dependencies[dependencyName]) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencyName}" is missing but should satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName },
          ...commentDetails,
        });
      } else if (
        getRealVersion(dependencies[dependencyName]) !== "*" &&
        !semver.satisfies(
          getRealVersion(dependencies[dependencyName]),
          dependencyRange,
          {
            includePrerelease: true,
          },
        ) &&
        !semver.intersects(
          getRealVersion(dependencies[dependencyName]),
          dependencyRange,
          {
            includePrerelease: true,
          },
        )
      ) {
        reportError({
          errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName },
          ...commentDetails,
        });
      }
    }
  }
}
