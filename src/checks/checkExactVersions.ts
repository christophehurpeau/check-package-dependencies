import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue } from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export interface CheckExactVersionsOptions {
  getDependencyPackageJson?: GetDependencyPackageJson;
  onlyWarnsForCheck: OnlyWarnsForCheck;
}

const isVersionRange = (version: string): boolean =>
  version.startsWith("^") ||
  version.startsWith("~") ||
  version.startsWith(">") ||
  version.startsWith("<");

const getExactVersionFromRange = (version: string): string => {
  const exactVersion = version.slice(version[1] === "=" ? 2 : 1);
  const parts = exactVersion.split(".").length;
  if (parts === 1) return `${exactVersion}.0.0`;
  if (parts === 2) return `${exactVersion}.0`;
  return exactVersion;
};

export function checkExactVersion(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  { getDependencyPackageJson, onlyWarnsForCheck }: CheckExactVersionsOptions,
): void {
  const dependencyName = dependencyValue.name;
  const version = getRealVersion(dependencyValue.value);

  if (!isVersionRange(version)) return;

  const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);

  if (shouldOnlyWarn || !getDependencyPackageJson) {
    reportError({
      errorMessage: "Unexpected range value",
      errorDetails: `expecting "${version}" to be exact "${getExactVersionFromRange(version)}"`,
      errorTarget: "dependencyValue",
      dependency: dependencyValue,
      onlyWarns: shouldOnlyWarn,
    });
    return;
  }

  const resolvedDep = (() => {
    try {
      const [dep] = getDependencyPackageJson(dependencyName);
      return dep;
    } catch {
      return null;
    }
  })();

  if (
    !resolvedDep?.version ||
    !semver.satisfies(resolvedDep.version, version, {
      includePrerelease: true,
    })
  ) {
    reportError({
      errorMessage: "Unexpected range value",
      errorDetails: `expecting "${version}" to be exact`,
      errorTarget: "dependencyValue",
      dependency: dependencyValue,
      onlyWarns: shouldOnlyWarn,
    });
    return;
  }

  reportError({
    errorMessage: "Unexpected range value",
    errorDetails: `expecting "${version}" to be exact "${resolvedDep.version}"`,
    errorTarget: "dependencyValue",
    dependency: dependencyValue,
    onlyWarns: shouldOnlyWarn,
    fixTo: resolvedDep.version,
  });
}
