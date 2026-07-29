import path from "node:path";
import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.ts";
import { checkWorkspaceMemberPeerDependencies } from "../../checks/checkWorkspaceMemberPeerDependencies.ts";
import type { ReportError } from "../../reporting/ReportError.ts";
import { getEntries } from "../../utils/object.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../../utils/packageTypes.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

const duplicatesSearchInByDependencyType: Partial<
  Record<DependencyTypes, DependencyTypes[]>
> = {
  devDependencies: ["devDependencies", "dependencies"],
  dependencies: ["devDependencies", "dependencies"],
  peerDependencies: ["peerDependencies"],
};

const isSamePackageJson = (
  pkg: ParsedPackageJson,
  otherPkg: ParsedPackageJson,
): boolean => path.resolve(pkg.path) === path.resolve(otherPkg.path);

const isWorkspaceRoot = (pkg: ParsedPackageJson): boolean =>
  pkg.workspacesPackages !== undefined;

/**
 * The linted package.json is compared with every other package of its workspace, and a
 * conflict is reported on the package whose range has to be raised, so that it is reported
 * once and where `eslint --fix` can change it. When neither range is higher, the workspace
 * root is never the one to change, and two members are ordered by name so that the same
 * package owns the conflict from both sides.
 */
const ownsUnorderedConflictsWith = (
  pkg: ParsedPackageJson,
  otherPkg: ParsedPackageJson,
): boolean => {
  if (isWorkspaceRoot(otherPkg)) return true;
  if (isWorkspaceRoot(pkg)) return false;
  if (pkg.name !== otherPkg.name) return pkg.name < otherPkg.name;
  return pkg.path < otherPkg.path;
};

interface GetOtherWorkspacePackagesParams {
  pkg: ParsedPackageJson;
  loadWorkspaceMemberPackageJsons: (
    workspaceRootPkg: ParsedPackageJson,
  ) => ParsedPackageJson[];
  getWorkspaceRootPackageJson: () => ParsedPackageJson | undefined;
}

/**
 * The packages the linted package.json shares its installed dependencies with: the members
 * of the workspace it is the root of, or the root and the other members of the workspace it
 * is a member of. `undefined` when it is not part of a workspace.
 */
const getOtherWorkspacePackages = ({
  pkg,
  loadWorkspaceMemberPackageJsons,
  getWorkspaceRootPackageJson,
}: GetOtherWorkspacePackagesParams): ParsedPackageJson[] | undefined => {
  if (isWorkspaceRoot(pkg)) return loadWorkspaceMemberPackageJsons(pkg);

  const rootPkg = getWorkspaceRootPackageJson();
  if (!rootPkg) return undefined;

  const memberPkgs = loadWorkspaceMemberPackageJsons(rootPkg);
  if (!memberPkgs.some((memberPkg) => isSamePackageJson(memberPkg, pkg))) {
    return undefined;
  }

  return [
    rootPkg,
    ...memberPkgs.filter((memberPkg) => !isSamePackageJson(memberPkg, pkg)),
  ];
};

/**
 * Errors about the linted package alone do not depend on the package it is compared to, so
 * they would otherwise be reported once per comparison.
 */
const createReportErrorOnce = (reportError: ReportError): ReportError => {
  const alreadyReported = new Set<string>();
  return (details) => {
    const reportKey = `${details.errorMessage}: ${String(details.errorDetails)}`;
    if (alreadyReported.has(reportKey)) return;
    alreadyReported.add(reportKey);
    reportError(details);
  };
};

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
    fixable: true,
    checkPackage: ({
      pkg,
      reportError,
      loadWorkspaceMemberPackageJsons,
      getDependencyPackageJson,
      getWorkspaceRootPackageJson,
      onlyWarnsForMappingCheck,
      isLibrary,
    }) => {
      const otherWorkspacePackages = getOtherWorkspacePackages({
        pkg,
        loadWorkspaceMemberPackageJsons,
        getWorkspaceRootPackageJson,
      });
      if (!otherWorkspacePackages) return;

      // duplicate dependencies only need comparing declared version ranges, so every other
      // package of the workspace can be compared from here directly.
      const reportErrorOnce = createReportErrorOnce(reportError);

      for (const otherPkg of otherWorkspacePackages) {
        const conflictOwnership = {
          ownsUnorderedConflicts: ownsUnorderedConflictsWith(pkg, otherPkg),
        };

        getEntries(duplicatesSearchInByDependencyType).forEach(
          ([depType, searchIn]) => {
            if (!searchIn) return;

            checkDuplicateDependencies({
              reportError: reportErrorOnce,
              pkg,
              isPkgLibrary: isLibrary,
              depType,
              searchIn,
              depPkg: otherPkg.value,
              onlyWarnsForCheck: onlyWarnsForMappingCheck.createFor(
                otherPkg.name,
              ),
              conflictOwnership,
            });
          },
        );
      }

      if (isWorkspaceRoot(pkg)) return;

      // checking peer dependencies of this package's own dependencies requires resolving them
      // from this package's directory, since that's where pnpm/npm/yarn actually link them
      // (they may not be hoisted to the monorepo root's node_modules).
      checkWorkspaceMemberPeerDependencies(reportError, {
        rootPkg: getWorkspaceRootPackageJson()!,
        memberPkg: pkg,
        getDependencyPackageJson,
        onlyWarnsForMappingCheck,
      });
    },
  },
);
