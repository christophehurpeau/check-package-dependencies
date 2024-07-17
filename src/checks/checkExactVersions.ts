import semver from "semver";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson";
import {
  createReportError,
  reportNotWarnedFor,
} from "../utils/createReportError";
import type { PackageJson, DependencyTypes } from "../utils/packageTypes";
import { getRealVersion } from "../utils/semverUtils";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils";

export interface CheckExactVersionsOptions {
  getDependencyPackageJson?: GetDependencyPackageJson;
  onlyWarnsForCheck: OnlyWarnsForCheck;
  internalExactVersionsIgnore?: OnlyWarnsFor;
  tryToAutoFix?: boolean;
  customCreateReportError?: typeof createReportError;
}

const isVersionRange = (version: string): boolean =>
  version.startsWith("^") ||
  version.startsWith("~") ||
  version.startsWith(">") ||
  version.startsWith("<");

// eslint-disable-next-line @typescript-eslint/require-await
export async function checkExactVersions(
  pkg: PackageJson,
  pkgPathName: string,
  types: DependencyTypes[],
  {
    getDependencyPackageJson,
    onlyWarnsForCheck,
    internalExactVersionsIgnore,
    tryToAutoFix = false,
    customCreateReportError = createReportError,
  }: CheckExactVersionsOptions,
): Promise<void> {
  const reportError = customCreateReportError("Exact versions", pkgPathName);

  for (const type of types) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) continue;

    for (const [dependencyName, versionValue] of Object.entries(
      pkgDependencies,
    )) {
      const version = getRealVersion(versionValue);

      if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
          continue;
        }
        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
        if (!shouldOnlyWarn && getDependencyPackageJson) {
          let resolvedDep;
          try {
            resolvedDep = getDependencyPackageJson(dependencyName);
          } catch {
            resolvedDep = null;
          }
          if (!resolvedDep?.version) {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact${
                tryToAutoFix
                  ? `, autofix failed to resolve "${dependencyName}".`
                  : ""
              }`,
              shouldOnlyWarn,
              false,
            );
          } else if (
            !semver.satisfies(resolvedDep.version, version, {
              includePrerelease: true,
            })
          ) {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact${
                tryToAutoFix
                  ? `, autofix failed as "${dependencyName}"'s resolved version is "${resolvedDep.version}" and doesn't satisfies "${version}".`
                  : ""
              }`,
              shouldOnlyWarn,
              false,
            );
          } else if (tryToAutoFix) {
            pkgDependencies[dependencyName] = resolvedDep.version;
          } else {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact "${resolvedDep.version}".`,
              shouldOnlyWarn,
              true,
            );
          }
        } else {
          let exactVersion = version.slice(version[1] === "=" ? 2 : 1);
          if (exactVersion.split(".").length < 3) {
            if (exactVersion.split(".").length === 1) {
              exactVersion = `${exactVersion}.0.0`;
            } else {
              exactVersion = `${exactVersion}.0`;
            }
          }
          reportError(
            `Unexpected range dependency in "${type}" for "${dependencyName}"`,
            `expecting "${version}" to be exact "${exactVersion}".`,
            shouldOnlyWarn,
            false,
          );
        }
      }
    }
  }

  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}
