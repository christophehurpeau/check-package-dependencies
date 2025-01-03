import semver from "semver";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import {
  createReportError,
  reportNotWarnedFor,
} from "../utils/createReportError.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

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
  pkg: ParsedPackageJson,
  types: DependencyTypes[],
  {
    getDependencyPackageJson,
    onlyWarnsForCheck,
    internalExactVersionsIgnore,
    tryToAutoFix = false,
    customCreateReportError = createReportError,
  }: CheckExactVersionsOptions,
): Promise<void> {
  const reportError = customCreateReportError("Exact versions", pkg.path);

  for (const type of types) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) continue;

    for (const [dependencyName, dependencyValue] of Object.entries(
      pkgDependencies,
    )) {
      if (!dependencyValue) continue;
      const version = getRealVersion(dependencyValue.value);

      if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
          continue;
        }
        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
        if (!shouldOnlyWarn && getDependencyPackageJson) {
          let resolvedDep;
          try {
            [resolvedDep] = getDependencyPackageJson(dependencyName);
          } catch {
            resolvedDep = null;
          }
          if (!resolvedDep?.version) {
            reportError({
              errorMessage: "Unexpected range dependency",
              errorDetails: `expecting "${version}" to be exact${
                tryToAutoFix
                  ? `, autofix failed to resolve "${dependencyName}"`
                  : ""
              }`,
              dependency: dependencyValue,
              onlyWarns: shouldOnlyWarn,
            });
          } else if (
            !semver.satisfies(resolvedDep.version, version, {
              includePrerelease: true,
            })
          ) {
            reportError({
              errorMessage: "Unexpected range dependency",
              errorDetails: `expecting "${version}" to be exact${
                tryToAutoFix
                  ? `, autofix failed as resolved version "${resolvedDep.version}" doesn't satisfy "${version}"`
                  : ""
              }`,
              dependency: dependencyValue,
              onlyWarns: shouldOnlyWarn,
            });
          } else if (tryToAutoFix) {
            dependencyValue.changeValue(resolvedDep.version);
          } else {
            reportError({
              errorMessage: "Unexpected range dependency",
              errorDetails: `expecting "${version}" to be exact "${resolvedDep.version}"`,
              dependency: dependencyValue,
              onlyWarns: shouldOnlyWarn,
              autoFixable: true,
            });
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
          reportError({
            errorMessage: "Unexpected range dependency",
            errorDetails: `expecting "${version}" to be exact "${exactVersion}"`,
            dependency: dependencyValue,
            onlyWarns: shouldOnlyWarn,
          });
        }
      }
    }
  }

  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}
