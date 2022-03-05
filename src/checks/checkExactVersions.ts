/* eslint-disable complexity */
import semver from 'semver';
import type { OnlyWarnsFor } from 'utils/shouldOnlyWarnFor';
import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import { shouldOnlyWarnFor } from '../utils/shouldOnlyWarnFor';

export interface CheckExactVersionsOptions {
  getDependencyPackageJson?: GetDependencyPackageJson;
  onlyWarnsFor?: OnlyWarnsFor;
  tryToAutoFix?: boolean;
}

const isVersionRange = (version: string): boolean =>
  version.startsWith('^') || version.startsWith('~');

export function checkExactVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  {
    getDependencyPackageJson,
    onlyWarnsFor = [],
    tryToAutoFix = false,
  }: CheckExactVersionsOptions = {},
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('Exact versions', pkgPathName);

  for (const [dependencyName, version] of Object.entries(pkgDependencies)) {
    if (isVersionRange(version)) {
      const shouldOnlyWarn = shouldOnlyWarnFor(dependencyName, onlyWarnsFor);
      if (!shouldOnlyWarn && tryToAutoFix && getDependencyPackageJson) {
        let resolvedDep;
        try {
          resolvedDep = getDependencyPackageJson(dependencyName);
        } catch {
          resolvedDep = null;
        }
        if (!resolvedDep || !resolvedDep.version) {
          reportError(
            `Unexpected range dependency in "${type}" for "${dependencyName}"`,
            `expecting "${version}" to be exact, autofix failed to resolve "${dependencyName}".`,
            shouldOnlyWarn,
          );
        } else if (
          !semver.satisfies(resolvedDep.version, version, {
            includePrerelease: true,
          })
        ) {
          reportError(
            `Unexpected range dependency in "${type}" for "${dependencyName}"`,
            `expecting "${version}" to be exact, autofix failed as "${dependencyName}"'s resolved version is "${resolvedDep.version}" and doesn't satisfies "${version}".`,
            shouldOnlyWarn,
          );
        } else {
          pkgDependencies[dependencyName] = resolvedDep.version;
        }
      } else {
        reportError(
          `Unexpected range dependency in "${type}" for "${dependencyName}"`,
          `expecting "${version}" to be exact "${version.slice(1)}".`,
          shouldOnlyWarn,
        );
      }
    }
  }
}
