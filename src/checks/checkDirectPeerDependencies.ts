import semver from "semver";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson";
import {
  createReportError,
  reportNotWarnedForMapping,
} from "../utils/createReportError";
import { getKeys } from "../utils/object";
import type {
  DependencyTypes,
  PackageJson,
  RegularDependencyTypes,
} from "../utils/packageTypes";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils";
import { checkPeerDependencies } from "./checkPeerDependencies";

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
  isLibrary: boolean,
  pkg: PackageJson,
  pkgPathName: string,
  getDependencyPackageJson: GetDependencyPackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  customCreateReportError = createReportError,
): void {
  const reportError = customCreateReportError("Peer Dependencies", pkgPathName);

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
      const depPkg = getDependencyPackageJson(depName);
      allDepPkgs.push({
        name: depName,
        type: depType,
        pkg: depPkg,
        hasDirectMatchingPeerDependency: pkg.peerDependencies?.[depName]
          ? semver.intersects(
              dependencies[depName],
              pkg.peerDependencies[depName],
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
        pkg,
        reportError,
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
