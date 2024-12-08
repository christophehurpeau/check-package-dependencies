import fs, { constants } from "node:fs";
import path from "node:path";
import type { Except, PackageJson } from "type-fest";
import type {
  CheckPackageApi,
  CreateCheckPackageOptions,
  OnlyWarnsForInDependenciesCheckPackageRecommendedOption,
  OnlyWarnsForInDependencyCheckPackageRecommendedOption,
  OnlyWarnsForInPackageCheckPackageRecommendedOption,
} from "./check-package.ts";
import { createCheckPackage } from "./check-package.ts";
import { checkDuplicateDependencies } from "./checks/checkDuplicateDependencies.ts";
import type { CheckResolutionMessage } from "./checks/checkResolutionsHasExplanation.ts";
import {
  createReportError,
  displayMessages,
  reportNotWarnedForMapping,
} from "./utils/createReportError.ts";
import type { OnlyWarnsForOptionalDependencyMapping } from "./utils/warnForUtils.ts";
import { createOnlyWarnsForMappingCheck } from "./utils/warnForUtils.ts";

interface OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption
  extends OnlyWarnsForInPackageCheckPackageRecommendedOption {
  duplicateDirectDependency: OnlyWarnsForInDependencyCheckPackageRecommendedOption["duplicateDirectDependency"];
}

type OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption = Record<
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/sort-type-constituents
  "*" | string,
  OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption
>;

type OnlyWarnsForInMonorepoPackagesDependenciesCheckPackageRecommendedOption =
  Record<string, OnlyWarnsForInDependenciesCheckPackageRecommendedOption>;

export interface CheckPackageWithWorkspacesRecommendedOptions {
  allowRangeVersionsInLibraries?: boolean;
  monorepoDirectDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  onlyWarnsForInRootPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
  onlyWarnsForInMonorepoPackages?: OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption;
  onlyWarnsForInRootDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
  onlyWarnsForInMonorepoPackagesDependencies?: OnlyWarnsForInMonorepoPackagesDependenciesCheckPackageRecommendedOption;
  checkResolutionMessage?: CheckResolutionMessage;
}

export interface CheckPackageWithWorkspacesApi {
  run: () => Promise<void>;

  checkRecommended: (
    options?: CheckPackageWithWorkspacesRecommendedOptions,
  ) => CheckPackageWithWorkspacesApi;

  forRoot: (
    callback: (checkPackage: CheckPackageApi) => void,
  ) => CheckPackageWithWorkspacesApi;
  forEach: (
    callback: (checkPackage: CheckPackageApi) => void,
  ) => CheckPackageWithWorkspacesApi;
  for: (
    id: string,
    callback: (checkPackage: CheckPackageApi) => void,
  ) => CheckPackageWithWorkspacesApi;
}

interface CreateCheckPackageWithWorkspacesOptions
  extends Except<CreateCheckPackageOptions, "isLibrary"> {
  isLibrary?: (pkg: PackageJson) => boolean;
}

export function createCheckPackageWithWorkspaces(
  createCheckPackageOptions: CreateCheckPackageWithWorkspacesOptions = {},
): CheckPackageWithWorkspacesApi {
  const checkPackage = createCheckPackage({
    ...createCheckPackageOptions,
    isLibrary: false,
  });
  const { pkg, pkgDirname } = checkPackage;

  const pkgWorkspaces: string[] | undefined =
    pkg.workspaces && !Array.isArray(pkg.workspaces)
      ? pkg.workspaces.packages
      : pkg.workspaces;

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspacePackagesPaths: string[] = [];

  // eslint-disable-next-line n/no-unsupported-features/node-builtins
  const match = fs.globSync(pkgWorkspaces, { cwd: pkgDirname });
  for (const pathMatch of match) {
    try {
      fs.accessSync(path.join(pathMatch, "package.json"), constants.R_OK);
    } catch {
      console.log(
        `Ignored potential directory, no package.json found: ${pathMatch}`,
      );
      continue;
    }

    const subPkgDirectoryPath = path.relative(process.cwd(), pathMatch);
    workspacePackagesPaths.push(subPkgDirectoryPath);
  }

  const checksWorkspaces = new Map<string, CheckPackageApi>(
    workspacePackagesPaths.map((subPkgDirectoryPath) => {
      const checkPkg = createCheckPackage({
        ...createCheckPackageOptions,
        packageDirectoryPath: subPkgDirectoryPath,
        internalWorkspacePkgDirectoryPath:
          createCheckPackageOptions.packageDirectoryPath || ".",
      });
      if (!checkPkg.pkg.name) {
        throw new Error(`Package "${subPkgDirectoryPath}" is missing name`);
      }
      return [checkPkg.pkg.name, checkPkg];
    }),
  );

  return {
    async run() {
      for (const checksWorkspace of [
        checkPackage,
        ...checksWorkspaces.values(),
      ]) {
        await checksWorkspace.run({ skipDisplayMessages: true });
      }

      displayMessages();
    },

    checkRecommended({
      allowRangeVersionsInLibraries = true,
      onlyWarnsForInRootPackage,
      onlyWarnsForInMonorepoPackages,
      onlyWarnsForInRootDependencies,
      onlyWarnsForInMonorepoPackagesDependencies = {},
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
    } = {}) {
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        onlyWarnsForInPackage: onlyWarnsForInRootPackage,
        onlyWarnsForInDependencies: onlyWarnsForInRootDependencies,
        checkResolutionMessage,
      });

      const monorepoDirectDuplicateDependenciesOnlyWarnsForCheck =
        createOnlyWarnsForMappingCheck(
          "monorepoDirectDuplicateDependenciesOnlyWarnsFor",
          monorepoDirectDuplicateDependenciesOnlyWarnsFor,
        );

      const previousCheckedWorkspaces = new Map<string, CheckPackageApi>();
      checksWorkspaces.forEach((checkSubPackage, id) => {
        checkSubPackage.checkRecommended({
          allowRangeVersionsInDependencies: checkSubPackage.isPkgLibrary
            ? allowRangeVersionsInLibraries
            : false,
          onlyWarnsForInPackage: onlyWarnsForInMonorepoPackages
            ? {
                ...onlyWarnsForInMonorepoPackages["*"],
                ...onlyWarnsForInMonorepoPackages[checkSubPackage.pkg.name],
              }
            : undefined,
          onlyWarnsForInDependencies: {
            ...onlyWarnsForInMonorepoPackagesDependencies["*"],
            ...onlyWarnsForInMonorepoPackagesDependencies[
              checkSubPackage.pkg.name
            ],
          },
          internalExactVersionsIgnore: [...checksWorkspaces.keys()],
          checkResolutionMessage,
        });

        const reportMonorepoDDDError = createReportError(
          "Monorepo Direct Duplicate Dependencies",
          checkSubPackage.pkgPathName,
        );
        // Root
        checkDuplicateDependencies(
          reportMonorepoDDDError,
          checkSubPackage.parsedPkg,
          checkSubPackage.isPkgLibrary,
          "devDependencies",
          ["dependencies", "devDependencies"],
          pkg,
          monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
            checkSubPackage.pkg.name,
          ),
        );
        // previous packages
        previousCheckedWorkspaces.forEach((previousCheckSubPackage) => {
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.parsedPkg,
            checkSubPackage.isPkgLibrary,
            "devDependencies",
            ["dependencies", "devDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.parsedPkg,
            checkSubPackage.isPkgLibrary,
            "dependencies",
            ["dependencies", "devDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.parsedPkg,
            checkSubPackage.isPkgLibrary,
            "peerDependencies",
            ["peerDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
          );
        });

        previousCheckedWorkspaces.set(id, checkSubPackage);
      });
      reportNotWarnedForMapping(
        createReportError(
          "Monorepo Direct Duplicate Dependencies",
          checkPackage.pkgPathName,
        ),
        monorepoDirectDuplicateDependenciesOnlyWarnsForCheck,
      );

      return this;
    },

    forRoot(callback) {
      callback(checkPackage);
      return this;
    },

    forEach(callback) {
      checksWorkspaces.forEach((checkSubPackage) => {
        callback(checkSubPackage);
      });
      return this;
    },

    for(id, callback) {
      const packageCheck = checksWorkspaces.get(id);
      if (!packageCheck) {
        throw new Error(
          `Invalid package name: ${id}. Known package names: "${[
            ...checksWorkspaces.keys(),
          ].join('","')}"`,
        );
      }
      callback(packageCheck);
      return this;
    },
  };
}
