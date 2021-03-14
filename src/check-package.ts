/* eslint-disable max-lines */
import path from 'path';
import {
  checkDirectDuplicateDependencies,
  checkWarnedFor,
} from './checks/checkDirectDuplicateDependencies';
import { checkExactVersions } from './checks/checkExactVersions';
import { checkIdenticalVersions } from './checks/checkIdenticalVersions';
import { checkIdenticalVersionsThanDependency } from './checks/checkIdenticalVersionsThanDependency';
import { checkNoDependencies } from './checks/checkNoDependencies';
import { checkPeerDependencies } from './checks/checkPeerDependencies';
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
import type { DependencyTypes, PackageJson } from './utils/packageTypes';

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
  checkResolutionMessage?: CheckResolutionMessage;
  /** @internal */
  internalWarnedForDuplicate?: Set<string>;
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

  checkExactVersions: () => CheckPackageApi;
  checkExactVersionsForLibrary: () => CheckPackageApi;
  checkExactDevVersions: () => CheckPackageApi;
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
    checkExactVersions() {
      checkExactVersions(pkg, pkgPathName, 'dependencies');
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      checkExactVersions(pkg, pkgPathName, 'resolutions');
      return this;
    },
    checkExactVersionsForLibrary() {
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      checkExactVersions(pkg, pkgPathName, 'resolutions');
      return this;
    },

    checkExactDevVersions() {
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      return this;
    },

    checkNoDependencies(
      type = 'dependencies',
      moveToSuggestion = 'devDependencies',
    ) {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({ isLibrary, onlyWarnsFor } = {}) {
      const checks: {
        type: DependencyTypes;
        allowedPeerIn: DependencyTypes[];
      }[] = [
        {
          type: 'devDependencies',
          allowedPeerIn: ['devDependencies', 'dependencies'],
        },
        {
          type: 'dependencies',
          allowedPeerIn: isLibrary
            ? ['devDependencies', 'dependencies']
            : ['dependencies'],
        },
      ];
      checks.forEach(({ type, allowedPeerIn }) => {
        if (!pkg[type]) return;
        getKeys(pkg[type]).forEach((depName) => {
          const depPkg = getDependencyPackageJson(depName);
          if (depPkg.peerDependencies) {
            checkPeerDependencies(
              pkg,
              pkgPathName,
              type,
              allowedPeerIn,
              depPkg,
              onlyWarnsFor,
            );
          }
          // TODO optionalPeerDependency
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
        checkWarnedFor(reportError, onlyWarnsFor, warnedForInternal);
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
      checkResolutionMessage,
      internalWarnedForDuplicate,
    } = {}) {
      if (isLibrary) {
        this.checkExactVersionsForLibrary();
      } else {
        this.checkExactVersions();
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
  };
}
