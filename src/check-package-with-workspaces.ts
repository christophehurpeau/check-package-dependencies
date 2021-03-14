import fs from 'fs';
import path from 'path';
import glob from 'glob';
import type { CheckPackageApi } from './check-package';
import { createCheckPackage } from './check-package';
import {
  checkDirectDuplicateDependencies,
  checkWarnedFor,
} from './checks/checkDirectDuplicateDependencies';
import type { CheckMessage } from './checks/checkResolutionsHasExplanation';
import { readPkgJson } from './utils/createGetDependencyPackageJson';
import { createReportError } from './utils/createReportError';
import type { PackageJson } from './utils/packageTypes';

export interface CheckPackageWithWorkspacesRecommendedOptions {
  isLibrary?: (pkgName: string) => boolean;
  peerDependenciesOnlyWarnsFor?: string[];
  directDuplicateDependenciesOnlyWarnsFor?: string[];
  checkResolutionMessage?: CheckMessage;
}

export interface CheckPackageWithWorkspacesApi {
  checkRecommended: (
    options?: CheckPackageWithWorkspacesRecommendedOptions,
  ) => CheckPackageWithWorkspacesApi;

  forRoot: (
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

  const pkgWorkspaces: undefined | string[] =
    pkg.workspaces && !Array.isArray(pkg.workspaces)
      ? pkg.workspaces.packages
      : pkg.workspaces;

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspaces: {
    id: string;
    pkgDirname: string;
    pkgDirectoryPath: string;
    pkgPath: string;
    pkg: PackageJson;
  }[] = [];

  if (pkgWorkspaces) {
    pkgWorkspaces.forEach((pattern) => {
      const match = glob.sync(`${pkgDirname}/${pattern}`);
      match.forEach((pathMatch) => {
        const stat = fs.statSync(pathMatch);
        if (!stat.isDirectory()) return;
        const pkgDirectoryPath = path.relative(process.cwd(), pathMatch);
        const pkgPath = path.join(pkgDirectoryPath, 'package.json');
        const pkg = readPkgJson(pkgPath);
        workspaces.push({
          id: pkg.name,
          pkgDirname: pathMatch,
          pkgDirectoryPath,
          pkgPath,
          pkg,
        });
      });
    });
  }

  const checksWorkspaces = new Map<string, CheckPackageApi>(
    workspaces.map(({ id, pkgDirectoryPath }) => [
      id,
      createCheckPackage(pkgDirectoryPath),
    ]),
  );

  return {
    checkRecommended({
      isLibrary = () => false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage,
    } = {}) {
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage,
      });

      const warnedForDuplicate = new Set<string>();
      checksWorkspaces.forEach((checkPackage, id) => {
        checkPackage.checkRecommended({
          isLibrary: isLibrary(id),
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          checkResolutionMessage,
          internalWarnedForDuplicate: warnedForDuplicate,
        });
        checkDirectDuplicateDependencies(
          pkg,
          pkgPathName,
          'devDependencies',
          ['devDependencies', 'dependencies'],
          pkg,
          [],
          warnedForDuplicate,
        );
      });

      checkWarnedFor(
        createReportError('Recommended Checks', pkgPathName),
        directDuplicateDependenciesOnlyWarnsFor,
        warnedForDuplicate,
      );

      return this;
    },

    forRoot(callback) {
      callback(checkPackage);
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
