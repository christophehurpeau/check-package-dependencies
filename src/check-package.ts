/* eslint-disable max-lines */
import path from 'path';
import {
  checkDirectDuplicateDependencies,
  checkWarnedFor,
} from './checks/checkDirectDuplicateDependencies';
import { checkDirectPeerDependencies } from './checks/checkDirectPeerDependencies';
import { checkExactVersions } from './checks/checkExactVersions';
import { checkIdenticalVersions } from './checks/checkIdenticalVersions';
import { checkIdenticalVersionsThanDependency } from './checks/checkIdenticalVersionsThanDependency';
import { checkNoDependencies } from './checks/checkNoDependencies';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import { checkResolutionsHasExplanation } from './checks/checkResolutionsHasExplanation';
import { checkSatisfiesVersionsFromDependency } from './checks/checkSatisfiesVersionsFromDependency';
import type { GetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
import {
  createGetDependencyPackageJson,
  readPkgJson,
} from './utils/createGetDependencyPackageJson';
import { createReportError } from './utils/createReportError';
import { getKeys } from './utils/object';
import type {
  RegularDependencyTypes,
  DependencyTypes,
  PackageJson,
} from './utils/packageTypes';

const regularDependencyTypes: RegularDependencyTypes[] = [
  'devDependencies',
  'dependencies',
  'optionalDependencies',
];

export interface CheckDirectPeerDependenciesOptions {
  isLibrary?: boolean;
  onlyWarnsFor?: string[];
}

export interface CheckDirectDuplicateDependenciesOptions {
  onlyWarnsFor?: string[];
  /** @internal */
  internalWarnedForDuplicate?: Set<string>;
}

export interface CheckRecommendedOptions {
  isLibrary?: boolean;
  peerDependenciesOnlyWarnsFor?: string[];
  directDuplicateDependenciesOnlyWarnsFor?: string[];
  exactVersionsOnlyWarnsFor?: string[];
  checkResolutionMessage?: CheckResolutionMessage;
  /** @internal */
  internalWarnedForDuplicate?: Set<string>;
}

export interface CheckExactVersionsOptions {
  onlyWarnsFor?: string[];
}

export interface CheckPackageApi {
  /** @internal */
  pkg: PackageJson;
  /** @internal */
  pkgDirname: string;
  /** @internal */
  pkgPathName: string;
  /** @internal */
  getDependencyPackageJson: GetDependencyPackageJson;

  checkExactVersions: (options?: CheckExactVersionsOptions) => CheckPackageApi;
  checkExactVersionsForLibrary: (
    options?: CheckExactVersionsOptions,
  ) => CheckPackageApi;
  checkExactDevVersions: (
    options?: CheckExactVersionsOptions,
  ) => CheckPackageApi;
  checkNoDependencies: (
    type?: DependencyTypes,
    moveToSuggestion?: DependencyTypes,
  ) => CheckPackageApi;
  checkDirectPeerDependencies: (
    options?: CheckDirectPeerDependenciesOptions,
  ) => CheckPackageApi;
  checkDirectDuplicateDependencies: (
    options?: CheckDirectDuplicateDependenciesOptions,
  ) => CheckPackageApi;
  checkResolutionsHasExplanation: (
    checkMessage?: CheckResolutionMessage,
  ) => CheckPackageApi;
  checkRecommended: (options?: CheckRecommendedOptions) => CheckPackageApi;
  checkIdenticalVersionsThanDependency: (
    depName: string,
    dependencies: {
      resolutions?: string[];
      dependencies?: string[];
      devDependencies?: string[];
    },
  ) => CheckPackageApi;
  checkIdenticalVersionsThanDevDependencyOfDependency: (
    depName: string,
    dependencies: {
      resolutions?: string[];
      dependencies?: string[];
      devDependencies?: string[];
    },
  ) => CheckPackageApi;
  checkSatisfiesVersionsFromDependency: (
    depName: string,
    dependencies: {
      resolutions?: string[];
      dependencies?: string[];
      devDependencies?: string[];
    },
  ) => CheckPackageApi;
  checkSatisfiesVersionsInDevDependenciesOfDependency: (
    depName: string,
    dependencies: {
      resolutions?: string[];
      dependencies?: string[];
      devDependencies?: string[];
    },
  ) => CheckPackageApi;
  checkIdenticalVersions: (dependencies: {
    resolutions?: Record<string, string[]>;
    dependencies?: Record<string, string[]>;
    devDependencies?: Record<string, string[]>;
  }) => CheckPackageApi;
  checkSatisfiesVersionsBetweenDependencies: (
    depName1: string,
    depName2: string,
    dependencies: {
      resolutions?: string[];
      dependencies?: string[];
      devDependencies?: string[];
    },
  ) => CheckPackageApi;
}

export function createCheckPackage(pkgDirectoryPath = '.'): CheckPackageApi {
  const pkgDirname = path.resolve(pkgDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${pkgDirectoryPath}/package.json`;
  const pkg = readPkgJson(pkgPath);

  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname,
  });

  return {
    pkg,
    pkgDirname,
    pkgPathName,
    getDependencyPackageJson,
    checkExactVersions({ onlyWarnsFor } = {}) {
      checkExactVersions(pkg, pkgPathName, 'dependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'resolutions', onlyWarnsFor);
      return this;
    },
    checkExactVersionsForLibrary({ onlyWarnsFor } = {}) {
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'resolutions', onlyWarnsFor);
      return this;
    },

    checkExactDevVersions({ onlyWarnsFor } = {}) {
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      return this;
    },

    checkNoDependencies(
      type = 'dependencies',
      moveToSuggestion = 'devDependencies',
    ) {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({ isLibrary = false, onlyWarnsFor } = {}) {
      regularDependencyTypes.forEach((depType) => {
        if (!pkg[depType]) return;
        getKeys(pkg[depType]).forEach((depName) => {
          const depPkg = getDependencyPackageJson(depName);
          if (depPkg.peerDependencies) {
            checkDirectPeerDependencies(
              isLibrary,
              pkg,
              pkgPathName,
              depType,
              depPkg,
              onlyWarnsFor,
            );
          }
        });
      });
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalWarnedForDuplicate,
    } = {}) {
      const warnedForInternal = internalWarnedForDuplicate || new Set();
      const checks: {
        type: DependencyTypes;
        searchIn: DependencyTypes[];
      }[] = [
        {
          type: 'devDependencies',
          searchIn: ['devDependencies', 'dependencies'],
        },
        { type: 'dependencies', searchIn: ['devDependencies', 'dependencies'] },
      ];
      checks.forEach(({ type, searchIn }) => {
        if (!pkg[type]) return;
        getKeys(pkg[type]).forEach((depName) => {
          const depPkg = getDependencyPackageJson(depName);
          checkDirectDuplicateDependencies(
            pkg,
            pkgPathName,
            'dependencies',
            searchIn,
            depPkg,
            onlyWarnsFor,
            warnedForInternal,
          );
        });
      });

      if (!warnedForInternal) {
        const reportError = createReportError(
          'Direct Duplicate Dependencies',
          pkgPathName,
        );
        checkWarnedFor(reportError, warnedForInternal, onlyWarnsFor);
      }
      return this;
    },

    checkResolutionsHasExplanation(
      checkMessage: CheckResolutionMessage = (depKey, message) => undefined,
    ) {
      checkResolutionsHasExplanation(
        pkg,
        pkgPathName,
        checkMessage,
        getDependencyPackageJson,
      );
      return this;
    },

    checkRecommended({
      isLibrary = false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      exactVersionsOnlyWarnsFor,
      checkResolutionMessage,
      internalWarnedForDuplicate,
    } = {}) {
      if (isLibrary) {
        this.checkExactVersionsForLibrary({
          onlyWarnsFor: exactVersionsOnlyWarnsFor,
        });
      } else {
        this.checkExactVersions({ onlyWarnsFor: exactVersionsOnlyWarnsFor });
      }

      this.checkDirectPeerDependencies({
        isLibrary,
        onlyWarnsFor: peerDependenciesOnlyWarnsFor,
      });

      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: directDuplicateDependenciesOnlyWarnsFor,
        internalWarnedForDuplicate,
      });

      this.checkResolutionsHasExplanation(checkResolutionMessage);
      return this;
    },

    checkIdenticalVersionsThanDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (dependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (devDependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      return this;
    },

    checkIdenticalVersionsThanDevDependencyOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (dependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (devDependencies) {
        checkIdenticalVersionsThanDependency(
          pkg,
          pkgPathName,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsFromDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (dependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.dependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsInDevDependenciesOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      const depPkg = getDependencyPackageJson(depName);
      if (resolutions) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'resolutions',
          resolutions,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (dependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'dependencies',
          dependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(
          pkg,
          pkgPathName,
          'devDependencies',
          devDependencies,
          depPkg,
          depPkg.devDependencies,
        );
      }
      return this;
    },

    checkIdenticalVersions({ resolutions, dependencies, devDependencies }) {
      if (resolutions) {
        checkIdenticalVersions(pkg, pkgPathName, 'resolutions', resolutions);
      }
      if (dependencies) {
        checkIdenticalVersions(pkg, pkgPathName, 'dependencies', dependencies);
      }
      if (devDependencies) {
        checkIdenticalVersions(
          pkg,
          pkgPathName,
          'devDependencies',
          devDependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsBetweenDependencies(
      depName1,
      depName2,
      { dependencies, devDependencies },
    ) {
      const depPkg1 = getDependencyPackageJson(depName1);
      const depPkg2 = getDependencyPackageJson(depName2);
      if (dependencies) {
        checkSatisfiesVersionsFromDependency(
          depPkg2,
          pkgPathName,
          'dependencies',
          dependencies,
          depPkg1,
          depPkg1.dependencies,
        );
      }
      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(
          depPkg2,
          pkgPathName,
          'devDependencies',
          devDependencies,
          depPkg1,
          depPkg1.dependencies,
        );
      }
      return this;
    },
  };
}
