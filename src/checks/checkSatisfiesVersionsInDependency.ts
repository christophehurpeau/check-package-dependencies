import semver from "semver";
import { createReportError } from "../utils/createReportError.ts";
import { getEntries } from "../utils/object.ts";
import type { DependenciesRanges, PackageJson } from "../utils/packageTypes.ts";

interface CheckSatisfiesVersionsInDependencyOptions {
  customCreateReportError?: typeof createReportError;
}

export function checkSatisfiesVersionsInDependency(
  pkgPathName: string,
  depPkg: PackageJson,
  dependenciesRanges: DependenciesRanges,
  {
    customCreateReportError = createReportError,
  }: CheckSatisfiesVersionsInDependencyOptions = {},
): void {
  const reportError = customCreateReportError(
    "Satisfies Versions In Dependency",
    pkgPathName,
  );

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
            title: `Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
            info: "it should not be present",
            dependency: { name: dependencyName },
          });
        }
      } else if (!dependencies) {
        reportError({
          title: `Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          info: `"${dependenciesType}" is missing`,
          dependency: { name: dependencyName },
        });
      } else if (!dependencies[dependencyName]) {
        reportError({
          title: `Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          info: `"${dependencyName}" is missing in ${dependenciesType} of "${depPkg.name}"`,
          dependency: { name: dependencyName },
        });
      } else if (
        !semver.satisfies(dependencies[dependencyName], dependencyRange, {
          includePrerelease: true,
        }) &&
        !semver.intersects(dependencies[dependencyName], dependencyRange, {
          includePrerelease: true,
        })
      ) {
        reportError({
          title: `Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          info: `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName },
        });
      }
    }
  }
}
