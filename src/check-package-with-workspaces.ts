import fs from 'fs';
import path from 'path';
import glob from 'glob';
import type { OnlyWarnsFor } from 'utils/shouldOnlyWarnFor';
import type { CheckPackageApi } from './check-package';
import { createCheckPackage } from './check-package';
import {
  checkDirectDuplicateDependencies,
  checkWarnedFor,
} from './checks/checkDirectDuplicateDependencies';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import { createReportError } from './utils/createReportError';

export interface CheckPackageWithWorkspacesRecommendedOptions {
  isLibrary?: (pkgName: string) => boolean;
  allowRangeVersionsInLibraries?: boolean;
  peerDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  directDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  monorepoDirectDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  checkResolutionMessage?: CheckResolutionMessage;
}

export interface CheckPackageWithWorkspacesApi {
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
): CheckPackageWithWorkspacesApi {
  const checkPackage = createCheckPackage(pkgDirectoryPath);
  const { pkg, pkgDirname, pkgPathName } = checkPackage;

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
      const checkPkg = createCheckPackage(subPkgDirectoryPath);
      return [checkPkg.pkg.name, checkPkg];
    }),
  );

  return {
    checkRecommended({
      isLibrary = () => false,
      allowRangeVersionsInLibraries = true,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
    } = {}) {
      const monorepoWarnedForDuplicate = new Set<string>();
      const warnedForDuplicate = new Set<string>();
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage,
        internalWarnedForDuplicate: warnedForDuplicate,
      });

      checksWorkspaces.forEach((checkSubPackage, id) => {
        const isPackageALibrary = isLibrary(id);
        checkSubPackage.checkRecommended({
          isLibrary: isPackageALibrary,
          allowRangeVersionsInDependencies: isPackageALibrary
            ? allowRangeVersionsInLibraries
            : false,
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          exactVersionsOnlyWarnsFor: [...checksWorkspaces.keys()],
          checkResolutionMessage,
          internalWarnedForDuplicate: warnedForDuplicate,
        });
        checkDirectDuplicateDependencies(
          checkSubPackage.pkg,
          checkSubPackage.pkgPathName,
          'devDependencies',
          ['devDependencies', 'dependencies'],
          pkg,
          monorepoDirectDuplicateDependenciesOnlyWarnsFor,
          monorepoWarnedForDuplicate,
          'Monorepo ',
        );
      });

      checkWarnedFor(
        createReportError('Recommended Checks', pkgPathName),
        warnedForDuplicate,
        directDuplicateDependenciesOnlyWarnsFor,
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
