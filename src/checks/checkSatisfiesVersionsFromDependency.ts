import semver from 'semver';
import type { ShouldHaveExactVersions } from '../check-package';
import { createReportError } from '../utils/createReportError';
import type { DependencyTypes, PackageJson } from '../utils/packageTypes';
import { changeOperator, getOperator } from '../utils/semverUtils';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

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
      );
      return;
    }

    const version = pkgDependencies[depKey];

    const autoFixIfPossible = (): boolean => {
      if (!tryToAutoFix) return false;
      const existingOperator = version ? getOperator(version) : null;
      const expectedOperator =
        existingOperator === null
          ? shouldHaveExactVersions(type)
            ? ''
            : null
          : existingOperator;
      const versionToApply =
        expectedOperator === ''
          ? semver.minVersion(range)?.version
          : changeOperator(range, expectedOperator);

      if (!versionToApply) {
        return false;
      }

      pkg[type] = {
        ...pkg[type],
        [depKey]: versionToApply,
      };
      return true;
    };

    if (!version) {
      if (!autoFixIfPossible()) {
        reportError(
          `Missing "${depKey}" in "${type}" of "${pkg.name}"`,
          `should satisfies "${range}" from "${depPkg.name}" in "${depType}".`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey),
        );
      }
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (
        !minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true,
        })
      ) {
        if (!autoFixIfPossible()) {
          reportError(
            `Invalid "${depKey}" in "${type}" of "${pkg.name}"`,
            `"${version}" should satisfies "${range}" from "${depPkg.name}"'s "${depType}".`,
            onlyWarnsForCheck?.shouldWarnsFor(depKey),
          );
        }
      }
    }
  });
}
