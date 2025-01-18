import semver from "semver";
import type { ShouldHaveExactVersions } from "../check-package.ts";
import type { ReportError } from "../reporting/ReportError.ts";
import {
  fromDependency,
  inDependency,
} from "../reporting/cliErrorReporting.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export interface CheckSatisfiesVersionsFromDependencyOptions {
  tryToAutoFix?: boolean;
  shouldHaveExactVersions: ShouldHaveExactVersions;
  onlyWarnsForCheck?: OnlyWarnsForCheck;
}

export function checkSatisfiesVersionsBetweenDependencies(
  reportError: ReportError,
  dep1Pkg: PackageJson,
  dep1Type: DependencyTypes,
  depKeys: string[],
  dep2Pkg: PackageJson,
  dep2Type: DependencyTypes,
  {
    tryToAutoFix,
    shouldHaveExactVersions,
    onlyWarnsForCheck,
  }: CheckSatisfiesVersionsFromDependencyOptions,
): void {
  const dep1Dependencies = dep1Pkg[dep1Type] || {};
  const dep2Dendencies = dep2Pkg[dep2Type] || {};

  depKeys.forEach((depKey) => {
    const dep1Range = dep1Dependencies[depKey];

    if (!dep1Range) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep1Pkg, dep1Type)}`,
        errorDetails: `config expects "${depKey}"`,
        onlyWarns: undefined,
        autoFixable: undefined,
      });
      return;
    }

    const dep2Range = dep2Dendencies[depKey];

    if (!dep2Range) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
        errorDetails: `should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
      return;
    }

    const minVersionOfVersion = semver.minVersion(dep2Range);
    if (
      !minVersionOfVersion ||
      !semver.satisfies(minVersionOfVersion, dep1Range, {
        includePrerelease: true,
      })
    ) {
      reportError({
        errorMessage: `Invalid "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
        errorDetails: `"${dep2Range}" should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
    }
  });
}
