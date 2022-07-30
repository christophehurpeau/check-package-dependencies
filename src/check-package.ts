/* eslint-disable complexity */
/* eslint-disable max-lines */
import path from 'path';
import util from 'util';
import { checkDirectDuplicateDependencies } from './checks/checkDirectDuplicateDependencies';
import { checkDirectPeerDependencies } from './checks/checkDirectPeerDependencies';
import { checkExactVersions } from './checks/checkExactVersions';
import { checkIdenticalVersions } from './checks/checkIdenticalVersions';
import { checkIdenticalVersionsThanDependency } from './checks/checkIdenticalVersionsThanDependency';
import { checkNoDependencies } from './checks/checkNoDependencies';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import { checkResolutionsHasExplanation } from './checks/checkResolutionsHasExplanation';
import { checkResolutionsVersionsMatch } from './checks/checkResolutionsVersionsMatch';
import { checkSatisfiesVersionsFromDependency } from './checks/checkSatisfiesVersionsFromDependency';
import type { GetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
import {
  createGetDependencyPackageJson,
  readPkgJson,
  writePkgJson,
} from './utils/createGetDependencyPackageJson';
import { getEntries } from './utils/object';
import type { DependencyTypes, PackageJson } from './utils/packageTypes';
import type {
  OnlyWarnsForOptionalDependencyMapping,
  OnlyWarnsFor,
  OnlyWarnsForDependencyMapping,
} from './utils/warnForUtils';
import {
  createOnlyWarnsForArrayCheck,
  createOnlyWarnsForMappingCheck,
} from './utils/warnForUtils';

export interface CreateCheckPackageOptions {
  /** @deprecated pass in cli --fix instead */
  tryToAutoFix?: boolean;
  /** @internal */
  internalWorkspacePkgDirectoryPath?: string;
}

export interface CheckDirectPeerDependenciesOptions {
  isLibrary?: boolean;
  /** @deprecated use missingOnlyWarnsFor or invalidOnlyWarnsFor */
  onlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  missingOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  invalidOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  internalMissingConfigName?: string;
  internalInvalidConfigName?: string;
}

export interface CheckDirectDuplicateDependenciesOptions {
  onlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
  internalConfigName?: string;
}

export interface OnlyWarnsForInPackageCheckPackageRecommendedOption {
  exactVersions: OnlyWarnsFor;
}

export interface OnlyWarnsForInDependencyCheckPackageRecommendedOption {
  duplicateDirectDependency: OnlyWarnsFor;
  missingPeerDependency: OnlyWarnsFor;
  invalidPeerDependencyVersion: OnlyWarnsFor;
}

export type OnlyWarnsForInDependenciesCheckPackageRecommendedOption = Record<
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  '*' | string,
  OnlyWarnsForInDependencyCheckPackageRecommendedOption
>;

export interface CheckRecommendedOptions {
  isLibrary?: boolean;
  /** default is true for libraries, false otherwise */
  allowRangeVersionsInDependencies?: boolean;
  onlyWarnsForInPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
  onlyWarnsForInDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
  /** @deprecated use onlyWarnsForInDependencies option */
  peerDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  /** @deprecated use onlyWarnsForInDependencies option */
  directDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsFor;
  /** @deprecated use onlyWarnsForInPackage option */
  exactVersionsOnlyWarnsFor?: OnlyWarnsFor;
  /** @internal */
  internalExactVersionsIgnore?: OnlyWarnsFor;
  /** function to check the value in the "resolutionExplained" key in package.json */
  checkResolutionMessage?: CheckResolutionMessage;
}

export interface CheckExactVersionsOptions {
  allowRangeVersionsInDependencies?: boolean;
  onlyWarnsFor?: OnlyWarnsFor;
  /** @internal */
  internalExactVersionsIgnore?: OnlyWarnsFor;
}

export interface CheckPackageApi {
  run: () => Promise<void>;

  /** @internal */
  pkg: PackageJson;
  /** @internal */
  pkgDirname: string;
  /** @internal */
  pkgPathName: string;
  /** @internal */
  getDependencyPackageJson: GetDependencyPackageJson;

  checkExactVersions: (options?: CheckExactVersionsOptions) => CheckPackageApi;
  checkResolutionsVersionsMatch: () => CheckPackageApi;
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

export function createCheckPackage(
  pkgDirectoryPath = '.',
  {
    tryToAutoFix = false,
    internalWorkspacePkgDirectoryPath,
  }: CreateCheckPackageOptions = {},
): CheckPackageApi {
  const pkgDirname = path.resolve(pkgDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${pkgDirectoryPath}/package.json`;
  const pkg = readPkgJson(pkgPath);
  const copyPkg: PackageJson = JSON.parse(JSON.stringify(pkg)) as PackageJson;

  if (
    process.env.CI &&
    process.env.CHECK_PACKAGE_DEPENDENCIES_ENABLE_CI_AUTOFIX !== 'true'
  ) {
    tryToAutoFix = false;
  }

  if (process.argv.slice(2).includes('--fix')) {
    tryToAutoFix = true;
  }

  const writePackageIfChanged = (): void => {
    if (!tryToAutoFix) return;
    if (util.isDeepStrictEqual(pkg, copyPkg)) return;
    writePkgJson(pkgPath, pkg);
  };

  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname,
  });

  let runCalled = false;

  if (!internalWorkspacePkgDirectoryPath) {
    process.on('beforeExit', () => {
      if (!runCalled) {
        console.warn(
          '\nFor future compatibility, call .run() and await the result.',
        );
      }
    });
  }

  return {
    run() {
      runCalled = true;
      return Promise.resolve();
    },

    pkg,
    pkgDirname,
    pkgPathName,
    getDependencyPackageJson,
    checkExactVersions({
      onlyWarnsFor,
      internalExactVersionsIgnore,
      allowRangeVersionsInDependencies = true,
    } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
        'checkExactVersions.onlyWarnsFor',
        onlyWarnsFor,
      );
      checkExactVersions(
        pkg,
        pkgPathName,
        !allowRangeVersionsInDependencies
          ? ['dependencies', 'devDependencies', 'resolutions']
          : ['devDependencies', 'resolutions'],
        {
          onlyWarnsForCheck,
          internalExactVersionsIgnore,
          getDependencyPackageJson,
          tryToAutoFix,
        },
      );
      writePackageIfChanged();
      return this;
    },

    checkResolutionsVersionsMatch() {
      checkResolutionsVersionsMatch(pkg, pkgPathName, {
        tryToAutoFix,
      });
      writePackageIfChanged();
      return this;
    },

    /** @deprecated use checkExactVersions({ allowRangeVersionsInDependencies: true })  */
    checkExactVersionsForLibrary({ onlyWarnsFor } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
        'checkExactVersionsForLibrary.onlyWarnsFor',
        onlyWarnsFor,
      );
      checkExactVersions(pkg, pkgPathName, ['devDependencies', 'resolutions'], {
        onlyWarnsForCheck,
        tryToAutoFix,
        getDependencyPackageJson,
      });
      writePackageIfChanged();
      return this;
    },

    checkExactDevVersions({ onlyWarnsFor } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
        'checkExactDevVersions.onlyWarnsFor',
        onlyWarnsFor,
      );
      checkExactVersions(pkg, pkgPathName, ['devDependencies'], {
        onlyWarnsForCheck,
        tryToAutoFix,
        getDependencyPackageJson,
      });
      writePackageIfChanged();
      return this;
    },

    checkNoDependencies(
      type = 'dependencies',
      moveToSuggestion = 'devDependencies',
    ) {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({
      isLibrary = false,
      onlyWarnsFor: deprecatedOnlyWarnsFor,
      missingOnlyWarnsFor = deprecatedOnlyWarnsFor,
      invalidOnlyWarnsFor = deprecatedOnlyWarnsFor,
      internalMissingConfigName = deprecatedOnlyWarnsFor
        ? 'onlyWarnsFor'
        : 'missingOnlyWarnsFor',
      internalInvalidConfigName = deprecatedOnlyWarnsFor
        ? 'onlyWarnsFor'
        : 'invalidOnlyWarnsFor',
    } = {}) {
      const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
        internalMissingConfigName,
        missingOnlyWarnsFor,
      );
      const invalidOnlyWarnsForCheck =
        internalInvalidConfigName === internalMissingConfigName
          ? missingOnlyWarnsForCheck
          : createOnlyWarnsForMappingCheck(
              internalInvalidConfigName,
              invalidOnlyWarnsFor,
            );
      checkDirectPeerDependencies(
        isLibrary,
        pkg,
        pkgPathName,
        getDependencyPackageJson,
        missingOnlyWarnsForCheck,
        invalidOnlyWarnsForCheck,
      );
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = 'onlyWarnsFor',
    } = {}) {
      checkDirectDuplicateDependencies(
        pkg,
        pkgPathName,
        'dependencies',
        getDependencyPackageJson,
        createOnlyWarnsForMappingCheck(internalConfigName, onlyWarnsFor),
      );
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
      onlyWarnsForInPackage,
      onlyWarnsForInDependencies,
      allowRangeVersionsInDependencies = isLibrary,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      exactVersionsOnlyWarnsFor,
      internalExactVersionsIgnore,
      checkResolutionMessage,
    } = {}) {
      let internalMissingPeerDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        peerDependenciesOnlyWarnsFor;
      let internalInvalidPeerDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        peerDependenciesOnlyWarnsFor;
      let internalDirectDuplicateDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        directDuplicateDependenciesOnlyWarnsFor;

      if (onlyWarnsForInPackage) {
        if (exactVersionsOnlyWarnsFor) {
          console.warn(
            'Ignoring "exactVersionsOnlyWarnsFor" as "onlyWarnsForInPackage" is used.',
          );
        }
        exactVersionsOnlyWarnsFor = onlyWarnsForInPackage.exactVersions || [];
      }
      if (onlyWarnsForInDependencies) {
        if (peerDependenciesOnlyWarnsFor) {
          console.warn(
            'Ignoring "peerDependenciesOnlyWarnsFor" as "onlyWarnsFor" is used.',
          );
        }
        if (directDuplicateDependenciesOnlyWarnsFor) {
          console.warn(
            'Ignoring "directDuplicateDependenciesOnlyWarnsFor" as "onlyWarnsFor" is used.',
          );
        }

        internalDirectDuplicateDependenciesOnlyWarnsFor = {};
        internalMissingPeerDependenciesOnlyWarnsFor = {};
        internalInvalidPeerDependenciesOnlyWarnsFor = {};

        getEntries(onlyWarnsForInDependencies).forEach(
          ([dependencyNameOrSpecialKey, onlyWarnsForValue]) => {
            if (onlyWarnsForValue.duplicateDirectDependency) {
              (
                internalDirectDuplicateDependenciesOnlyWarnsFor as OnlyWarnsForDependencyMapping
              )[dependencyNameOrSpecialKey] =
                onlyWarnsForValue.duplicateDirectDependency;
            }
            if (onlyWarnsForValue.missingPeerDependency) {
              (
                internalMissingPeerDependenciesOnlyWarnsFor as OnlyWarnsForDependencyMapping
              )[dependencyNameOrSpecialKey] =
                onlyWarnsForValue.missingPeerDependency;
            }
            if (onlyWarnsForValue.invalidPeerDependencyVersion) {
              (
                internalInvalidPeerDependenciesOnlyWarnsFor as OnlyWarnsForDependencyMapping
              )[dependencyNameOrSpecialKey] =
                onlyWarnsForValue.invalidPeerDependencyVersion;
            }
          },
        );
      }

      this.checkExactVersions({
        allowRangeVersionsInDependencies,
        onlyWarnsFor: exactVersionsOnlyWarnsFor,
        internalExactVersionsIgnore,
      });

      this.checkResolutionsVersionsMatch();
      this.checkResolutionsHasExplanation(checkResolutionMessage);

      this.checkDirectPeerDependencies({
        isLibrary,
        missingOnlyWarnsFor: internalMissingPeerDependenciesOnlyWarnsFor,
        invalidOnlyWarnsFor: internalInvalidPeerDependenciesOnlyWarnsFor,
        internalMissingConfigName: peerDependenciesOnlyWarnsFor
          ? 'peerDependenciesOnlyWarnsFor'
          : 'onlyWarnsForInDependencies.missingPeerDependency',
        internalInvalidConfigName: peerDependenciesOnlyWarnsFor
          ? 'peerDependenciesOnlyWarnsFor'
          : 'onlyWarnsForInDependencies.invalidPeerDependencyVersion',
      });

      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
        internalConfigName: directDuplicateDependenciesOnlyWarnsFor
          ? 'directDuplicateDependenciesOnlyWarnsFor'
          : 'onlyWarnsForInDependencies.duplicateDirectDependency',
      });

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
