import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { getKeys } from "../utils/object.ts";
import type {
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
  RegularDependencyTypes,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { checkPeerDependencies } from "./checkPeerDependencies.ts";

const regularDependencyTypes: RegularDependencyTypes[] = [
  "devDependencies",
  "dependencies",
  "optionalDependencies",
];

const getAllowedPeerInFromType = (
  depPkgType: RegularDependencyTypes,
  isLibrary: boolean,
): DependencyTypes[] => {
  switch (depPkgType) {
    case "devDependencies":
      return ["devDependencies", "dependencies"];
    case "dependencies":
      return isLibrary
        ? ["dependencies", "peerDependencies"]
        : ["devDependencies", "dependencies"];
    case "optionalDependencies":
      return isLibrary
        ? ["dependencies", "optionalDependencies", "peerDependencies"]
        : ["devDependencies", "dependencies"];

    // no default
  }
};

export function checkDirectPeerDependencies(
  reportError: ReportError,
  isLibrary: boolean,
  pkg: ParsedPackageJson,
  getDependencyPackageJson: GetDependencyPackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
): void {
  const allDepPkgs: {
    name: string;
    type: RegularDependencyTypes;
    pkg: PackageJson;
    hasDirectMatchingPeerDependency: boolean;
  }[] = [];
  const allDirectDependenciesDependencies: [string, string][] = [];

  regularDependencyTypes.forEach((depType) => {
    const dependencies = pkg[depType];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const [depPkg] = getDependencyPackageJson(depName);
      allDepPkgs.push({
        name: depName,
        type: depType,
        pkg: depPkg,
        hasDirectMatchingPeerDependency: pkg.peerDependencies?.[depName]
          ? semver.intersects(
              dependencies[depName]!.value,
              pkg.peerDependencies[depName].value,
            )
          : false,
      });

      if (depPkg.dependencies && !isLibrary) {
        allDirectDependenciesDependencies.push(
          ...Object.entries(depPkg.dependencies),
        );
      }
    }
  });

  for (const {
    name: depName,
    type: depType,
    pkg: depPkg,
    hasDirectMatchingPeerDependency,
  } of allDepPkgs) {
    if (depPkg.peerDependencies) {
      checkPeerDependencies(
        reportError,
        pkg,
        depType,
        getAllowedPeerInFromType(depType, isLibrary),
        hasDirectMatchingPeerDependency,
        allDirectDependenciesDependencies,
        depPkg,
        missingOnlyWarnsForCheck.createFor(depName),
        invalidOnlyWarnsForCheck.createFor(depName),
      );
    }
  }

  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}
