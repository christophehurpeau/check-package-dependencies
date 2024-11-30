import semver from "semver";
import type { ShouldHaveExactVersions } from "../check-package.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import { changeOperator, getOperator } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export interface CheckSatisfiesVersionsFromDependencyOptions {
  tryToAutoFix?: boolean;
  shouldHaveExactVersions: ShouldHaveExactVersions;
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
    shouldHaveExactVersions,
    onlyWarnsForCheck,
    customCreateReportError = createReportError,
  }: CheckSatisfiesVersionsFromDependencyOptions,
): void {
  const pkgDependencies = pkg[type] || {};
  const dependencies = depPkg[depType] || {};

  const reportError = customCreateReportError(
    "Satisfies Versions From Dependency",
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];

    if (!range) {
      reportError({
        title: "Unexpected missing dependency",
        info: `config expects "${depKey}" in "${depType}" of "${depPkg.name}"`,
        dependency: { name: depKey, origin: depType },
        onlyWarns: undefined,
        autoFixable: undefined,
      });
      return;
    }

    const version = pkgDependencies[depKey];

    const getAutoFixIfExists = (): string | null | undefined => {
      const existingOperator = version ? getOperator(version) : null;
      const expectedOperator = (() => {
        if (existingOperator !== null) {
          return existingOperator;
        }
        return shouldHaveExactVersions(type) ? "" : null;
      })();

      return expectedOperator === ""
        ? semver.minVersion(range)?.version
        : changeOperator(range, expectedOperator);
    };

    const autoFix = (versionToApply: string): void => {
      pkg[type] = {
        ...pkg[type],
        [depKey]: versionToApply,
      };
    };

    if (!version) {
      const fix = getAutoFixIfExists();
      if (!fix || !tryToAutoFix) {
        reportError({
          title: "Missing dependency",
          info: `should satisfies "${range}" from "${depPkg.name}" in "${depType}"`,
          dependency: { name: depKey, origin: type },
          onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
          autoFixable: !!fix,
        });
      } else {
        autoFix(fix);
      }
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        const fix = getAutoFixIfExists();
        if (!fix || !tryToAutoFix) {
          reportError({
            title: "Invalid",
            info: `"${version}" should satisfies "${range}" from "${depPkg.name}" in "${depType}"`,
            dependency: { name: depKey, origin: type },
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            autoFixable: !!fix,
          });
        } else {
          autoFix(fix);
        }
      }
    }
  });
}
