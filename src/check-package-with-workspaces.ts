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
import { checkMonorepoDirectSubpackagePeerDependencies } from "./checks/checkMonorepoDirectSubpackagePeerDependencies.ts";
import type { CheckResolutionMessage } from "./checks/checkResolutionsHasExplanation.ts";
import {
  createCliReportError,
  displayMessages,
  reportNotWarnedForMapping,
} from "./reporting/cliErrorReporting.ts";
import type { LibrarySetting } from "./utils/library.ts";
import { assertNoLegacyIsLibraryOption } from "./utils/library.ts";
import { resolveWorkspacesPackagesGlobs } from "./utils/pnpmWorkspaceYaml.ts";
import type { OnlyWarnsForOptionalDependencyMapping } from "./utils/warnForUtils.ts";
import { createOnlyWarnsForMappingCheck } from "./utils/warnForUtils.ts";

interface OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption extends OnlyWarnsForInPackageCheckPackageRecommendedOption {
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
  monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
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

interface CreateCheckPackageWithWorkspacesOptions extends Except<
  CreateCheckPackageOptions,
  "library"
> {
  /**
   * Applied to the workspace members only, the root is never a library.
   * Defaults to "auto", see {@link CreateCheckPackageOptions.library}.
   */
  library?: LibrarySetting | ((pkg: PackageJson) => boolean);
}

export function createCheckPackageWithWorkspaces({
  createReportError = createCliReportError,
  ...createCheckPackageOptions
}: CreateCheckPackageWithWorkspacesOptions = {}): CheckPackageWithWorkspacesApi {
  assertNoLegacyIsLibraryOption(createCheckPackageOptions);

  const checkPackage = createCheckPackage({
    createReportError,
    ...createCheckPackageOptions,
    library: false,
  });
  const { pkg, pkgDirname } = checkPackage;

  const pkgPathName = path.join(pkgDirname, "package.json");

  const pkgWorkspaces = resolveWorkspacesPackagesGlobs(pkg, pkgPathName);

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspacePackagesPaths: string[] = [];

  const match = fs.globSync(pkgWorkspaces, {
    cwd: pkgDirname,
    exclude: ["**/node_modules"],
  });
  for (const pathMatch of match) {
    try {
      fs.accessSync(path.join(pathMatch, "package.json"), constants.R_OK);
    } catch {
      console.warn(
        `[warn] ${pkgPathName} workspaces: ignored potential directory, no package.json found: ${pathMatch}`,
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
        createReportError,
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
      monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor,
      monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor,
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

      const monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck =
        createOnlyWarnsForMappingCheck(
          "monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor",
          monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor,
        );

      const monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck =
        createOnlyWarnsForMappingCheck(
          "monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor",
          monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor,
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
        const reportMonorepoDPDError = createReportError(
          `Monorepo Direct Peer Dependencies for dependencies of "${checkSubPackage.pkg.name}" (${checkSubPackage.pkgPathName})`,
          checkPackage.pkgPathName,
        );

        const duplicateDependenciesParams = {
          reportError: reportMonorepoDDDError,
          pkg: checkSubPackage.parsedPkg,
          isPkgLibrary: checkSubPackage.isPkgLibrary,
          onlyWarnsForCheck:
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
        };

        // Root
        checkDuplicateDependencies({
          ...duplicateDependenciesParams,
          depType: "devDependencies",
          searchIn: ["dependencies", "devDependencies"],
          depPkg: pkg,
        });
        // previous packages
        previousCheckedWorkspaces.forEach((previousCheckSubPackage) => {
          checkDuplicateDependencies({
            ...duplicateDependenciesParams,
            depType: "devDependencies",
            searchIn: ["dependencies", "devDependencies"],
            depPkg: previousCheckSubPackage.pkg,
          });
          checkDuplicateDependencies({
            ...duplicateDependenciesParams,
            depType: "dependencies",
            searchIn: ["dependencies", "devDependencies"],
            depPkg: previousCheckSubPackage.pkg,
          });
          checkDuplicateDependencies({
            ...duplicateDependenciesParams,
            depType: "peerDependencies",
            searchIn: ["peerDependencies"],
            depPkg: previousCheckSubPackage.pkg,
          });
        });
        checkMonorepoDirectSubpackagePeerDependencies(
          reportMonorepoDPDError,
          checkSubPackage.isPkgLibrary,
          checkPackage.parsedPkg,
          checkSubPackage.parsedPkg,
          checkSubPackage.getDependencyPackageJson,
          monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck,
          monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck,
        );

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
