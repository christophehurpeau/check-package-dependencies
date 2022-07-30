/* eslint-disable max-lines */
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import type {
  CreateCheckPackageOptions,
  CheckPackageApi,
  OnlyWarnsForInDependenciesCheckPackageRecommendedOption,
  OnlyWarnsForInDependencyCheckPackageRecommendedOption,
  OnlyWarnsForInPackageCheckPackageRecommendedOption,
} from './check-package';
import { createCheckPackage } from './check-package';
import { checkDuplicateDependencies } from './checks/checkDuplicateDependencies';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import {
  createReportError,
  reportNotWarnedForMapping,
} from './utils/createReportError';
import type {
  OnlyWarnsFor,
  OnlyWarnsForOptionalDependencyMapping,
} from './utils/warnForUtils';
import { createOnlyWarnsForMappingCheck } from './utils/warnForUtils';

interface OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption
  extends OnlyWarnsForInPackageCheckPackageRecommendedOption {
  duplicateDirectDependency: OnlyWarnsForInDependencyCheckPackageRecommendedOption['duplicateDirectDependency'];
}

type OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption = Record<
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  '*' | string,
  OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption
>;

type OnlyWarnsForInMonorepoPackagesDependenciesCheckPackageRecommendedOption =
  Record<string, OnlyWarnsForInDependenciesCheckPackageRecommendedOption>;

export interface CheckPackageWithWorkspacesRecommendedOptions {
  isLibrary?: (pkgName: string) => boolean;
  allowRangeVersionsInLibraries?: boolean;
  /** @deprecated use onlyWarnsFor */
  peerDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  /** @deprecated use onlyWarnsFor */
  directDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  monorepoDirectDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  onlyWarnsForInRootPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
  onlyWarnsForInMonorepoPackages?: OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption;
  /** @deprecated use onlyWarnsForInRootDependencies */
  onlyWarnsForInDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
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

export function createCheckPackageWithWorkspaces(
  pkgDirectoryPath = '.',
  createCheckPackageOptions: CreateCheckPackageOptions = {},
): CheckPackageWithWorkspacesApi {
  const checkPackage = createCheckPackage(
    pkgDirectoryPath,
    createCheckPackageOptions,
  );
  const { pkg, pkgDirname } = checkPackage;

  const pkgWorkspaces: string[] | undefined =
    pkg.workspaces && !Array.isArray(pkg.workspaces)
      ? pkg.workspaces.packages
      : pkg.workspaces;

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspacePackagesPaths: string[] = [];

  if (pkgWorkspaces) {
    pkgWorkspaces.forEach((pattern) => {
      const match = glob.sync(`${pkgDirname}/${pattern}`);
      match.forEach((pathMatch) => {
        const stat = fs.statSync(pathMatch);
        if (!stat.isDirectory()) return;
        const subPkgDirectoryPath = path.relative(process.cwd(), pathMatch);
        workspacePackagesPaths.push(subPkgDirectoryPath);
      });
    });
  }

  const checksWorkspaces = new Map<string, CheckPackageApi>(
    workspacePackagesPaths.map((subPkgDirectoryPath) => {
      const checkPkg = createCheckPackage(
        subPkgDirectoryPath,
        createCheckPackageOptions,
      );
      return [checkPkg.pkg.name, checkPkg];
    }),
  );

  let runCalled = false;

  process.on('beforeExit', () => {
    if (!runCalled) {
      console.warn('\nFor future compatibility, call .run()');
    }
  });

  return {
    async run() {
      runCalled = true;
      await Promise.all(
        [...checksWorkspaces.values()].map((checksWorkspace) =>
          checksWorkspace.run(),
        ),
      );
    },

    checkRecommended({
      isLibrary = () => false,
      allowRangeVersionsInLibraries = true,
      onlyWarnsForInRootPackage,
      onlyWarnsForInMonorepoPackages,
      onlyWarnsForInDependencies,
      onlyWarnsForInRootDependencies = onlyWarnsForInDependencies,
      onlyWarnsForInMonorepoPackagesDependencies = onlyWarnsForInDependencies
        ? { '*': onlyWarnsForInDependencies }
        : {},
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
    } = {}) {
      if (peerDependenciesOnlyWarnsFor) {
        console.warn(
          'Option "peerDependenciesOnlyWarnsFor" in checkRecommended() is deprecated. Use "onlyWarnsForInDependencies" instead.',
        );
      }
      if (directDuplicateDependenciesOnlyWarnsFor) {
        console.warn(
          'Option "directDuplicateDependenciesOnlyWarnsFor" in checkRecommended() is deprecated. Use "onlyWarnsForInDependencies" instead.',
        );
      }

      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        onlyWarnsForInPackage: onlyWarnsForInRootPackage,
        onlyWarnsForInDependencies: onlyWarnsForInRootDependencies,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage,
      });

      const monorepoDirectDuplicateDependenciesOnlyWarnsForCheck =
        createOnlyWarnsForMappingCheck(
          'monorepoDirectDuplicateDependenciesOnlyWarnsFor',
          monorepoDirectDuplicateDependenciesOnlyWarnsFor,
        );

      const previousCheckedWorkspaces = new Map<string, CheckPackageApi>();
      checksWorkspaces.forEach((checkSubPackage, id) => {
        const isPackageALibrary = isLibrary(id);
        checkSubPackage.checkRecommended({
          isLibrary: isPackageALibrary,
          allowRangeVersionsInDependencies: isPackageALibrary
            ? allowRangeVersionsInLibraries
            : false,
          onlyWarnsForInPackage: onlyWarnsForInMonorepoPackages
            ? {
                ...onlyWarnsForInMonorepoPackages['*'],
                ...onlyWarnsForInMonorepoPackages[checkSubPackage.pkg.name],
              }
            : undefined,
          onlyWarnsForInDependencies:
            onlyWarnsForInMonorepoPackagesDependencies[
              checkSubPackage.pkg.name
            ],
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          internalExactVersionsIgnore: [...checksWorkspaces.keys()],
          checkResolutionMessage,
        });

        const reportMonorepoDDDError = createReportError(
          'Monorepo Direct Duplicate Dependencies',
          checkSubPackage.pkgPathName,
        );
        // Root
        checkDuplicateDependencies(
          reportMonorepoDDDError,
          checkSubPackage.pkg,
          'devDependencies',
          ['dependencies', 'devDependencies'],
          pkg,
          monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
            checkSubPackage.pkg.name,
          ),
        );
        // previous packages
        previousCheckedWorkspaces.forEach((previousCheckSubPackage) => {
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            'devDependencies',
            ['dependencies', 'devDependencies'],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            'dependencies',
            ['dependencies', 'devDependencies'],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name,
            ),
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            'peerDependencies',
            ['peerDependencies'],
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
          'Monorepo Direct Duplicate Dependencies',
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
