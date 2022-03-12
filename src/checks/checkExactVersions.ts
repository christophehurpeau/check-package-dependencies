/* eslint-disable complexity */
import semver from 'semver';
import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import {
  createReportError,
  reportNotWarnedFor,
} from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsFor, OnlyWarnsForCheck } from '../utils/warnForUtils';

export interface CheckExactVersionsOptions {
  getDependencyPackageJson?: GetDependencyPackageJson;
  onlyWarnsForCheck: OnlyWarnsForCheck;
  internalExactVersionsIgnore?: OnlyWarnsFor;
  tryToAutoFix?: boolean;
}

const isVersionRange = (version: string): boolean =>
  version.startsWith('^') || version.startsWith('~');

export function checkExactVersions(
  pkg: PackageJson,
  pkgPathName: string,
  types: DependencyTypes[],
  {
    getDependencyPackageJson,
    onlyWarnsForCheck,
    internalExactVersionsIgnore,
    tryToAutoFix = false,
  }: CheckExactVersionsOptions,
): void {
  const reportError = createReportError('Exact versions', pkgPathName);

  types.forEach((type) => {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) return;

    for (const [dependencyName, versionConst] of Object.entries(
      pkgDependencies,
    )) {
      let version = versionConst;
      if (version.startsWith('npm:')) {
        const match = /^npm:.*@(.*)$/.exec(version);
        if (!match) throw new Error(`Invalid version match: ${version}`);
        const [, realVersion] = match;
        version = realVersion;
      }

      if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
          return;
        }
        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
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
  });

  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}
