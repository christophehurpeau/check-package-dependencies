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
import { checkPeerDependencies } from "./checkPeerDependencies.ts";

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
      checkPeerDependencies(
        reportError,
        monorepoPkg,
        depType,
        ["devDependencies"],
        true, // we only check those that are defined in monorepo pkg, to make sure if there were missing in subpackage, that we don't have several versions of them.
        [], // this is only used if allowMissing is not true
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
