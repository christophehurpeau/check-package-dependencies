import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { getEntries } from "../utils/object.ts";
import type {
  DependencyValue,
  PackageJson,
  ParsedPackageJson,
  RegularDependencyTypes,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.ts";
import {
  checkMissingSatisfiesVersions,
  checkSatisfiesVersion,
} from "./checkSatisfiesVersions.ts";

/**
 * Which dependencies of the package are expected to satisfy the range declared by
 * another dependency, keyed by the name of that other dependency.
 */
export type SatisfiesVersionsFromDependencyConfig = Record<
  string,
  Commented & Partial<Record<RegularDependencyTypes, string[]>>
>;

export interface CheckSatisfiesVersionsFromDependencyOptions {
  dependencies: SatisfiesVersionsFromDependencyConfig;
  /** the field of the other dependency's package.json the expected ranges are read from */
  readRangesFrom: "dependencies" | "devDependencies";
  getDependencyPackageJson: GetDependencyPackageJson;
  onlyWarnsForCheck?: OnlyWarnsForCheck;
}

interface RangeInDependencyParams {
  depName: string;
  depPkg: PackageJson;
  readRangesFrom: "dependencies" | "devDependencies";
  dependencyName: string;
}

function getRangeInDependency({
  depName,
  depPkg,
  readRangesFrom,
  dependencyName,
}: RangeInDependencyParams): string {
  const range = depPkg[readRangesFrom]?.[dependencyName];
  if (!range) {
    throw new Error(
      `Dependency "${depName}" has no "${dependencyName}" in "${readRangesFrom}"`,
    );
  }
  return range;
}

export function checkMissingSatisfiesVersionsFromDependency(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  {
    dependencies,
    readRangesFrom,
    getDependencyPackageJson,
    onlyWarnsForCheck,
  }: CheckSatisfiesVersionsFromDependencyOptions,
): void {
  getEntries(dependencies).forEach(([depName, dependencyNamesByType]) => {
    const [depPkg] = getDependencyPackageJson(depName);

    regularDependencyTypes.forEach((type) => {
      const dependencyNames = dependencyNamesByType[type];
      if (!dependencyNames) return;

      checkMissingSatisfiesVersions(
        reportError,
        pkg,
        type,
        Object.fromEntries(
          dependencyNames.map((dependencyName) => [
            dependencyName,
            {
              range: getRangeInDependency({
                depName,
                depPkg,
                readRangesFrom,
                dependencyName,
              }),
              comment: dependencyNamesByType.comment,
            },
          ]),
        ),
        onlyWarnsForCheck,
      );
    });
  });
}

export function checkDependencySatisfiesVersionFromDependency(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  {
    dependencies,
    readRangesFrom,
    getDependencyPackageJson,
    onlyWarnsForCheck,
  }: CheckSatisfiesVersionsFromDependencyOptions,
): void {
  if (
    !(regularDependencyTypes as string[]).includes(dependencyValue.fieldName)
  ) {
    return;
  }
  const fieldName = dependencyValue.fieldName as RegularDependencyTypes;

  getEntries(dependencies).forEach(([depName, dependencyNamesByType]) => {
    if (!dependencyNamesByType[fieldName]?.includes(dependencyValue.name)) {
      return;
    }

    const [depPkg] = getDependencyPackageJson(depName);
    checkSatisfiesVersion(
      reportError,
      dependencyValue,
      {
        range: getRangeInDependency({
          depName,
          depPkg,
          readRangesFrom,
          dependencyName: dependencyValue.name,
        }),
        comment: dependencyNamesByType.comment,
      },
      onlyWarnsForCheck,
    );
  });
}
