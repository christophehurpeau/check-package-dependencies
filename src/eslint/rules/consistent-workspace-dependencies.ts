import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.ts";
import { isPeerDependencyDeclaredInPackage } from "../../checks/checkMonorepoDirectSubpackagePeerDependencies.ts";
import { checkSatisfiesPeerDependency } from "../../checks/checkPeerDependencies.ts";
import type { ReportError } from "../../reporting/ReportError.ts";
import { getKeys } from "../../utils/object.ts";
import type {
  DependencyFieldTypes,
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
  RegularDependencyTypes,
} from "../../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../../utils/warnForUtils.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

const duplicatesSearchInByDependencyType: Partial<
  Record<DependencyFieldTypes, DependencyTypes[]>
> = {
  devDependencies: ["devDependencies", "dependencies"],
  dependencies: ["devDependencies", "dependencies"],
  peerDependencies: ["peerDependencies"],
};

interface CheckDuplicateInAllDependenciesParams {
  reportError: ReportError;
  basePkg: ParsedPackageJson;
  subPkg: ParsedPackageJson;
  isPkgLibrary: boolean;
  onlyWarnsForCheck: OnlyWarnsForCheck;
  /**
   * Errors about the subpackage alone do not depend on the package it is compared
   * to, so they would otherwise be reported once per comparison.
   */
  alreadyReported: Set<string>;
}

const checkDuplicateInAllDependencies = ({
  reportError,
  basePkg,
  subPkg,
  isPkgLibrary,
  onlyWarnsForCheck,
  alreadyReported,
}: CheckDuplicateInAllDependenciesParams): void => {
  (["devDependencies", "dependencies"] as const).forEach((depType) => {
    const dependencies = basePkg[depType];
    if (!dependencies || !duplicatesSearchInByDependencyType[depType]) return;

    checkDuplicateDependencies(
      ({ dependency, errorMessage, ...otherDetails }) => {
        // hide dependency from error details as it is the dependency of the sub package and we are in the context of the root package
        const message = `${subPkg.name}: ${errorMessage}`;
        const reportKey = `${message}: ${String(otherDetails.errorDetails)}`;
        if (alreadyReported.has(reportKey)) return;
        alreadyReported.add(reportKey);
        reportError({
          ...otherDetails,
          errorMessage: message,
        });
      },
      subPkg,
      isPkgLibrary,
      depType,
      duplicatesSearchInByDependencyType[depType],
      basePkg.value,
      onlyWarnsForCheck,
    );
  });
};

// TODO this rule is currently very limited in the way errors are reported. It should be improved.
export const consistentWorkspaceDependenciesRule = createPackageRule(
  "consistent-workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    docs: {
      description:
        "Enforce consistent dependency versions across the packages of a workspace",
      recommended: true,
    },
    checkPackage: ({
      pkg,
      reportError,
      loadWorkspacePackageJsons,
      getDependencyPackageJson,
      getWorkspaceRootPackageJson,
      onlyWarnsForMappingCheck,
      isLibraryFor,
    }) => {
      if (pkg.workspacesPackages) {
        // running on the monorepo root package.json: duplicate dependencies only need
        // comparing declared version ranges, so they can be checked from here directly.
        const workspacePackageJsons = loadWorkspacePackageJsons();

        const previousCheckedWorkspaces: ParsedPackageJson[] = [];
        const alreadyReported = new Set<string>();

        for (const subPkg of workspacePackageJsons) {
          const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor(
            subPkg.name,
          );
          // the subpackage is checked here, not the linted root, so the "library"
          // setting is resolved against the subpackage itself.
          const isSubPkgLibrary = isLibraryFor(subPkg);

          // root
          checkDuplicateInAllDependencies({
            reportError,
            basePkg: pkg,
            subPkg,
            isPkgLibrary: isSubPkgLibrary,
            onlyWarnsForCheck,
            alreadyReported,
          });

          // previous packages
          previousCheckedWorkspaces.forEach((previousSubPkg) => {
            checkDuplicateInAllDependencies({
              reportError,
              basePkg: previousSubPkg,
              subPkg,
              isPkgLibrary: isSubPkgLibrary,
              onlyWarnsForCheck,
              alreadyReported,
            });
          });

          // add to previous checked workspaces
          previousCheckedWorkspaces.push(subPkg);
        }
        return;
      }

      // running on a workspace member's own package.json: checking peer dependencies of
      // this package's own dependencies requires resolving them from this package's
      // directory, since that's where pnpm/npm/yarn actually link them (they may not be
      // hoisted to the monorepo root's node_modules).
      const rootPkg = getWorkspaceRootPackageJson();
      if (!rootPkg) return;

      const allDepPkgs: {
        name: string;
        type: RegularDependencyTypes;
        pkg: PackageJson;
      }[] = [];

      regularDependencyTypes.forEach((depType) => {
        const dependencies = pkg[depType];
        if (!dependencies) return;
        for (const depName of getKeys(dependencies)) {
          const [depPkg] = getDependencyPackageJson(depName);
          if (rootPkg.devDependencies?.[depName]) {
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
            if (isPeerDependencyDeclaredInPackage(pkg, peerDepName)) {
              continue; // skip as already checked in checkDirectPeerDependencies for the subpackage itself.
            }
            checkSatisfiesPeerDependency(
              reportError,
              rootPkg,
              depType,
              ["devDependencies"],
              peerDepName,
              range,
              depPkg,
              onlyWarnsForMappingCheck.createFor(
                `${depName}:peedDepdencies:invalid`,
              ),
            );
          }
        }
      }
    },
  },
);
