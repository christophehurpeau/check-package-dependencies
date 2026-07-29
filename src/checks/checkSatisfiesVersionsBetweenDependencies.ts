import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type {
  DependencyValue,
  RegularDependencyTypes,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.ts";
import { isVersionSatisfiesRange } from "./checkSatisfiesVersions.ts";

/** the dependency a range is read from, and the field it is read in */
export type SatisfiesVersionsBetweenDependenciesSide =
  | string
  | { name: string; in?: RegularDependencyTypes };

export interface SatisfiesVersionsBetweenDependenciesConfig {
  /** the dependency whose range is compared in both packages */
  name: string;
  from: SatisfiesVersionsBetweenDependenciesSide;
  to: SatisfiesVersionsBetweenDependenciesSide;
}

export interface CheckSatisfiesVersionsBetweenDependenciesOptions {
  dependencies: SatisfiesVersionsBetweenDependenciesConfig[];
  getDependencyPackageJson: GetDependencyPackageJson;
  onlyWarnsForCheck?: OnlyWarnsForCheck;
}

interface ResolvedSide {
  depName: string;
  depType: RegularDependencyTypes;
  range: string;
}

interface ResolveSideParams {
  side: SatisfiesVersionsBetweenDependenciesSide;
  dependencyName: string;
  getDependencyPackageJson: GetDependencyPackageJson;
}

function resolveSide({
  side,
  dependencyName,
  getDependencyPackageJson,
}: ResolveSideParams): ResolvedSide {
  const depName = typeof side === "string" ? side : side.name;
  const depType =
    typeof side === "string" ? "dependencies" : (side.in ?? "dependencies");

  const [depPkg] = getDependencyPackageJson(depName);
  const range = depPkg[depType]?.[dependencyName];
  if (!range) {
    throw new Error(
      `Dependency "${depName}" has no dependency "${dependencyName}" in "${depType}"`,
    );
  }

  return { depName, depType, range };
}

export function checkSatisfiesVersionsBetweenDependencies(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  {
    dependencies,
    getDependencyPackageJson,
    onlyWarnsForCheck,
  }: CheckSatisfiesVersionsBetweenDependenciesOptions,
): void {
  if (
    !(regularDependencyTypes as string[]).includes(dependencyValue.fieldName)
  ) {
    return;
  }

  dependencies.forEach(({ name, from, to }) => {
    const fromName = typeof from === "string" ? from : from.name;
    if (fromName !== dependencyValue.name) return;

    const fromSide = resolveSide({
      side: from,
      dependencyName: name,
      getDependencyPackageJson,
    });
    const toSide = resolveSide({
      side: to,
      dependencyName: name,
      getDependencyPackageJson,
    });

    if (!isVersionSatisfiesRange(fromSide.range, toSide.range)) {
      reportError({
        errorMessage: `Version not satisfied between dependencies for dependency "${name}"`,
        errorDetails: `"${fromSide.range}" from "${fromSide.depName}" ${fromSide.depType} should satisfies "${toSide.range}" from "${toSide.depName}" ${toSide.depType}`,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(dependencyValue.name),
      });
    }
  });
}
