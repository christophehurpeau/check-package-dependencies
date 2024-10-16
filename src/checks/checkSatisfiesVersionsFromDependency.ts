import semver from "semver";
import type { ShouldHaveExactVersions } from "../check-package";
import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import { changeOperator, getOperator } from "../utils/semverUtils";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";

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
    `Satisfies Versions from "${depPkg.name}"`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];

    if (!range) {
      reportError(
        `Unexpected missing dependency "${depKey}" in "${depPkg.name}"`,
        `config expects "${depKey}" in "${depType}" of "${depPkg.name}".`,
        undefined,
        false,
      );
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
        reportError(
          `Missing "${depKey}" in "${type}" of "${pkg.name}"`,
          `should satisfies "${range}" from "${depPkg.name}" in "${depType}".`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey),
          !!fix,
        );
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
          reportError(
            `Invalid "${depKey}" in "${type}" of "${pkg.name}"`,
            `"${version}" should satisfies "${range}" from "${depPkg.name}"'s "${depType}".`,
            onlyWarnsForCheck?.shouldWarnsFor(depKey),
            !!fix,
          );
        } else {
          autoFix(fix);
        }
      }
    }
  });
}
