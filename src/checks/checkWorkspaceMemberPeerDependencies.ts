import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { getKeys } from "../utils/object.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.ts";
import { checkSatisfiesPeerDependency } from "./checkPeerDependencies.ts";

const memberDeclaredDependencyTypes: DependencyTypes[] = [
  "devDependencies",
  "dependencies",
  "peerDependencies",
  "optionalDependencies",
];

// A peer dependency already declared by the workspace member itself is validated by
// checkDirectPeerDependencies (the require-direct-peer-dependencies rule), so checking
// it against the workspace root would only duplicate that report.
export const isPeerDependencyDeclaredInPackage = (
  pkg: ParsedPackageJson,
  peerDepName: string,
): boolean =>
  memberDeclaredDependencyTypes.some((depType) => pkg[depType]?.[peerDepName]);

export interface CheckWorkspaceMemberPeerDependenciesOptions {
  rootPkg: ParsedPackageJson;
  memberPkg: ParsedPackageJson;
  getDependencyPackageJson: GetDependencyPackageJson;
  onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck;
}

/**
 * Checks the peer dependencies of the dependencies of a workspace member against the
 * `devDependencies` of the workspace root, which is where a workspace member usually
 * gets them from.
 */
export function checkWorkspaceMemberPeerDependencies(
  reportError: ReportError,
  {
    rootPkg,
    memberPkg,
    getDependencyPackageJson,
    onlyWarnsForMappingCheck,
  }: CheckWorkspaceMemberPeerDependenciesOptions,
): void {
  regularDependencyTypes.forEach((depType) => {
    const dependencies = memberPkg[depType];
    if (!dependencies) return;

    for (const depName of getKeys(dependencies)) {
      if (rootPkg.devDependencies?.[depName]) {
        continue; // already checked as a dependency of the root
      }

      const [depPkg] = getDependencyPackageJson(depName);
      if (!depPkg.peerDependencies) continue;

      for (const [peerDepName, range] of Object.entries(
        depPkg.peerDependencies,
      )) {
        if (isPeerDependencyDeclaredInPackage(memberPkg, peerDepName)) continue;

        checkSatisfiesPeerDependency(
          reportError,
          rootPkg,
          depType,
          ["devDependencies"],
          peerDepName,
          range,
          depPkg,
          onlyWarnsForMappingCheck.createFor(depName),
        );
      }
    }
  });
}
