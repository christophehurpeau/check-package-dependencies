import type { ReportError } from "../reporting/ReportError.ts";
import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { getKeys } from "../utils/object.ts";
import type {
  PackageJson,
  ParsedPackageJson,
  RegularDependencyTypes,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.ts";
import { checkSatisfiesPeerDependency } from "./checkPeerDependencies.ts";

export function checkMonorepoDirectSubpackagePeerDependencies(
  reportError: ReportError,
  isLibrary: boolean,
  monorepoPkg: ParsedPackageJson,
  subpackagePkg: ParsedPackageJson,
  getDependencyPackageJson: GetDependencyPackageJson,
  invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
  missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck,
): void {
  const allDepPkgs: {
    name: string;
    type: RegularDependencyTypes;
    pkg: PackageJson;
  }[] = [];

  regularDependencyTypes.forEach((depType) => {
    const dependencies = subpackagePkg[depType];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const [depPkg] = getDependencyPackageJson(depName);
      if (monorepoPkg.devDependencies?.[depName]) {
        continue; // we already checked this.
      }
      allDepPkgs.push({ name: depName, type: depType, pkg: depPkg });
    }
  });

  for (const { name: depName, type: depType, pkg: depPkg } of allDepPkgs) {
    if (depPkg.peerDependencies) {
      for (const [peerDepName, range] of Object.entries(
        depPkg.peerDependencies,
      )) {
        if (subpackagePkg.devDependencies?.[peerDepName]) {
          continue; // skip as already checked in checkDirectPeerDependencies for the subpackage itself.
        }
        checkSatisfiesPeerDependency(
          reportError,
          monorepoPkg,
          depType,
          ["devDependencies"],
          peerDepName,
          range,
          depPkg,
          invalidOnlyWarnsForCheck.createFor(depName),
        );
      }
    }
  }

  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}
