import semver from "semver";
import type { ShouldHaveExactVersions } from "../check-package.ts";
import type { ReportError } from "../reporting/ReportError.ts";
import {
  fromDependency,
  inDependency,
} from "../reporting/cliErrorReporting.ts";
import type {
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { changeOperator, getOperator } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export interface CheckSatisfiesVersionsFromDependencyOptions {
  tryToAutoFix?: boolean;
  shouldHaveExactVersions: ShouldHaveExactVersions;
  onlyWarnsForCheck?: OnlyWarnsForCheck;
}

export function checkSatisfiesVersionsFromDependency(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  depType: DependencyTypes,
  {
    tryToAutoFix,
    shouldHaveExactVersions,
    onlyWarnsForCheck,
  }: CheckSatisfiesVersionsFromDependencyOptions,
): void {
  const pkgDependencies = pkg[type] || {};
  const dependencies = depPkg[depType] || {};

  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];

    if (!range) {
      reportError({
        errorMessage: "Unexpected missing dependency",
        errorDetails: `config expects "${depKey}" ${inDependency(depPkg, depType)}`,
        onlyWarns: undefined,
        autoFixable: undefined,
      });
      return;
    }

    const pkgRange = pkgDependencies[depKey];

    const getAutoFixIfExists = (): string | null | undefined => {
      const existingOperator = pkgRange ? getOperator(pkgRange.value) : null;
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

    if (!pkgRange) {
      const fix = getAutoFixIfExists();
      if (!fix || !tryToAutoFix) {
        reportError({
          errorMessage: "Missing dependency",
          errorDetails: `should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
          dependency: { name: depKey, fieldName: type },
          onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
          autoFixable: !!fix,
        });
      } else {
        pkg.change(type, depKey, fix);
      }
    } else {
      const minVersionOfVersion = semver.minVersion(pkgRange.value);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        const fix = getAutoFixIfExists();
        if (!fix || !tryToAutoFix) {
          reportError({
            errorMessage: "Invalid",
            errorDetails: `"${pkgRange.value}" should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
            dependency: pkgRange,
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            autoFixable: !!fix,
          });
        } else {
          pkgRange.changeValue(fix);
        }
      }
    }
  });
}
