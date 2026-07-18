import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.ts";
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

const checkDuplicateInAllDependencies = (
  reportError: ReportError,
  basePkg: ParsedPackageJson,
  subPkg: ParsedPackageJson,
  isPkgLibrary: boolean,
  onlyWarnsForCheck: OnlyWarnsForCheck,
): void => {
  (["devDependencies", "dependencies"] as const).forEach((depType) => {
    const dependencies = basePkg[depType];
    if (!dependencies || !duplicatesSearchInByDependencyType[depType]) return;

    checkDuplicateDependencies(
      ({ dependency, errorMessage, ...otherDetails }) => {
        // hide dependency from error details as it is the dependency of the sub package and we are in the context of the root package
        reportError({
          ...otherDetails,
          errorMessage: `${subPkg.name}: ${errorMessage}`,
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
    checkPackage: ({
      pkg,
      settings,
      reportError,
      loadWorkspacePackageJsons,
      getDependencyPackageJson,
      getWorkspaceRootPackageJson,
      onlyWarnsForMappingCheck,
    }) => {
      if (pkg.workspacesPackages) {
        // running on the monorepo root package.json: duplicate dependencies only need
        // comparing declared version ranges, so they can be checked from here directly.
        const workspacePackageJsons = loadWorkspacePackageJsons();

        const previousCheckedWorkspaces: ParsedPackageJson[] = [];

        for (const subPkg of workspacePackageJsons) {
          const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor(
            subPkg.name,
          );

          // root
          checkDuplicateInAllDependencies(
            reportError,
            pkg,
            subPkg,
            settings.isLibrary ?? false,
            onlyWarnsForCheck,
          );

          // previous packages
          previousCheckedWorkspaces.forEach((previousSubPkg) => {
            checkDuplicateInAllDependencies(
              reportError,
              previousSubPkg,
              subPkg,
              settings.isLibrary ?? false,
              onlyWarnsForCheck,
            );
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
            if (pkg.devDependencies?.[peerDepName]) {
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
