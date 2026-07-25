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
import { regularDependencyTypes } from "./checkDirectPeerDependencies.ts";
import { checkSatisfiesPeerDependency } from "./checkPeerDependencies.ts";

const subpackageDeclaredDependencyTypes: DependencyTypes[] = [
  "devDependencies",
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
];

// A peer dependency already declared by the subpackage itself is validated by
// checkDirectPeerDependencies (the require-direct-peer-dependencies rule), so the
// monorepo-root check would only duplicate that report.
export const isPeerDependencyDeclaredInPackage = (
  pkg: ParsedPackageJson,
  peerDepName: string,
): boolean =>
  subpackageDeclaredDependencyTypes.some(
    (depType) => pkg[depType]?.[peerDepName],
  );

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
        if (isPeerDependencyDeclaredInPackage(subpackagePkg, peerDepName)) {
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
