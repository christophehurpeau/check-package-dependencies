/* eslint-disable max-lines */
import path from 'path';
import util from 'util';
import { checkDirectDuplicateDependencies } from './checks/checkDirectDuplicateDependencies';
import { checkDirectPeerDependencies } from './checks/checkDirectPeerDependencies';
import { checkExactVersions } from './checks/checkExactVersions';
import { checkIdenticalVersions } from './checks/checkIdenticalVersions';
import { checkIdenticalVersionsThanDependency } from './checks/checkIdenticalVersionsThanDependency';
import { checkMinRangeSatisfies } from './checks/checkMinRangeSatisfies';
import { checkNoDependencies } from './checks/checkNoDependencies';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import { checkResolutionsHasExplanation } from './checks/checkResolutionsHasExplanation';
import { checkResolutionsVersionsMatch } from './checks/checkResolutionsVersionsMatch';
import { checkSatisfiesVersions } from './checks/checkSatisfiesVersions';
import { checkSatisfiesVersionsFromDependency } from './checks/checkSatisfiesVersionsFromDependency';
import { checkSatisfiesVersionsInDependency } from './checks/checkSatisfiesVersionsInDependency';
import type { GetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
import { createGetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
import { displayConclusion } from './utils/createReportError';
import { getEntries } from './utils/object';
import type {
  DependenciesRanges,
  DependencyName,
  DependencyTypes,
  PackageJson,
} from './utils/packageTypes';
import { readPkgJson, writePkgJson } from './utils/pkgJsonUtils';
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
  packageDirectoryPath?: string;
  isLibrary?: boolean | ((pkg: PackageJson) => boolean);
  /** @internal */
  internalWorkspacePkgDirectoryPath?: string;
}

export interface CheckDirectPeerDependenciesOptions {
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
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents, @typescript-eslint/sort-type-constituents
  '*' | string,
  OnlyWarnsForInDependencyCheckPackageRecommendedOption
>;

export interface CheckRecommendedOptions {
  /** default is true for libraries, false otherwise */
  allowRangeVersionsInDependencies?: boolean;
  onlyWarnsForInPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
  onlyWarnsForInDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
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

export interface CheckPackageApiRunOptions {
  /** @internal */
  skipDisplayConclusion?: boolean;
}

export interface CheckPackageApi {
  run: (options?: CheckPackageApiRunOptions) => Promise<void>;

  /** @internal */
  pkg: PackageJson;
  /** @internal */
  pkgDirname: string;
  /** @internal */
  pkgPathName: string;
  /** @internal */
  isPkgLibrary: boolean;
  /** @internal */
  getDependencyPackageJson: GetDependencyPackageJson;

  checkExactVersions: (options?: CheckExactVersionsOptions) => CheckPackageApi;

  checkResolutionsVersionsMatch: () => CheckPackageApi;

  checkExactDevVersions: (
    options?: CheckExactVersionsOptions,
  ) => CheckPackageApi;

  checkNoDependencies: (
    type?: DependencyTypes,
    moveToSuggestion?: DependencyTypes,
  ) => CheckPackageApi;

  /**
   * @example
   * ```
   * .checkDirectPeerDependencies({
   *   invalidOnlyWarnsFor: ['semver'],
   * })
   * ```
   */
  checkDirectPeerDependencies: (
    options?: CheckDirectPeerDependenciesOptions,
  ) => CheckPackageApi;

  /**
   * @example
   * ```
   * .checkDirectDuplicateDependencies({
   *   invalidOnlyWarnsFor: { '*': 'type-fest' },
   * })
   * ```
   */
  checkDirectDuplicateDependencies: (
    options?: CheckDirectDuplicateDependenciesOptions,
  ) => CheckPackageApi;

  checkResolutionsHasExplanation: (
    checkMessage?: CheckResolutionMessage,
  ) => CheckPackageApi;

  checkRecommended: (options?: CheckRecommendedOptions) => CheckPackageApi;

  /**
   * @example
   * Check that your package.json contains the same version of @babel/core than react-scripts, both in resolutions and devDependencies
   * ```
   * .checkIdenticalVersionsThanDependency('react-scripts', {
   *   resolutions: ['@babel/core'],
   *   devDependencies: ['@babel/core'],
   * })
   * ```
   */
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

  /**
   * Check that your package.json dependencies specifically satisfies the range passed in config
   *
   * @example
   * ```
   * .checkSatisfiesVersions({
   *   devDependencies: {
   *     eslint: '^8.0.0'
   *   },
   * })
   * ```
   */
  checkSatisfiesVersions: (
    dependencies: Partial<
      Record<DependencyTypes, Record<DependencyName, string>>
    >,
  ) => CheckPackageApi;

  /**
   * Check that your package.json dependencies specifically satisfies the range set in another dependencies
   * @example
   * ```
   * .checkSatisfiesVersionsFromDependency('@pob/eslint-config-typescript', {
   *   devDependencies: [
   *     '@typescript-eslint/eslint-plugin',
   *     '@typescript-eslint/parser',
   *   ],
   * })
   * ```
   */
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

  /**
   * Check that your package.json dependencies have the exact same version that another dependency also present in your package.json
   * @example
   * The react-dom version should match react, so this check will ensure it does
   * ```
   * .checkIdenticalVersions({
   *   dependencies: {
   *     react: {
   *       dependencies: ['react-dom'],
   *       devDependencies: ['react-test-renderer'],
   *     },
   *   },
   * })
   * ```
   */
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

  /**
   * Check versions in a dependency
   * Also useable to check if a dependency is not present
   *
   * @example
   * Checking if `@lerna/version` has no dependency `@nrwl/devkit`
   * ```
   * .checkSatisfiesVersionsInDependency('@lerna/version', {
   *   dependencies: {
   *     '@nrwl/devkit': null,
   *   },
   * })
   * ```
   */
  checkSatisfiesVersionsInDependency: (
    depName: string,
    dependenciesRanges: DependenciesRanges,
  ) => CheckPackageApi;

  checkMinRangeDependenciesSatisfiesDevDependencies: () => CheckPackageApi;
}

export function createCheckPackage({
  packageDirectoryPath = '.',
  internalWorkspacePkgDirectoryPath,
  isLibrary = false,
}: CreateCheckPackageOptions = {}): CheckPackageApi {
  const pkgDirname = path.resolve(packageDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${packageDirectoryPath}/package.json`;
  const pkg = readPkgJson(pkgPath);
  const copyPkg: PackageJson = JSON.parse(JSON.stringify(pkg)) as PackageJson;
  const isPkgLibrary =
    typeof isLibrary === 'function' ? isLibrary(pkg) : isLibrary;

  let tryToAutoFix = false;

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
        throw new Error('Call .run() and await the result.');
      }
    });
  }

  class Job {
    name: string;

    fn: () => Promise<void>;

    constructor(name: string, fn: () => Promise<void>) {
      this.name = name;
      this.fn = fn;
    }

    async run(): Promise<void> {
      try {
        await this.fn();
      } catch (err) {
        throw new Error(`${this.name} failed: ${(err as Error).message}`);
      }
    }
  }

  const jobs: Job[] = [];

  return {
    async run({
      skipDisplayConclusion = false,
    }: CheckPackageApiRunOptions = {}) {
      runCalled = true;
      // TODO parallel
      for (const job of jobs) {
        await job.run();
      }
      writePackageIfChanged();
      if (!skipDisplayConclusion) {
        displayConclusion();
      }
    },

    pkg,
    pkgDirname,
    pkgPathName,
    isPkgLibrary,
    getDependencyPackageJson,
    checkExactVersions({
      onlyWarnsFor,
      internalExactVersionsIgnore,
      allowRangeVersionsInDependencies = true,
    } = {}) {
      jobs.push(
        new Job(this.checkExactVersions.name, async () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            'checkExactVersions.onlyWarnsFor',
            onlyWarnsFor,
          );
          await checkExactVersions(
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
        }),
      );
      return this;
    },

    checkResolutionsVersionsMatch() {
      checkResolutionsVersionsMatch(pkg, pkgPathName, {
        tryToAutoFix,
      });
      return this;
    },

    checkExactDevVersions({ onlyWarnsFor } = {}) {
      jobs.push(
        new Job(this.checkExactDevVersions.name, async () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            'checkExactDevVersions.onlyWarnsFor',
            onlyWarnsFor,
          );
          await checkExactVersions(pkg, pkgPathName, ['devDependencies'], {
            onlyWarnsForCheck,
            tryToAutoFix,
            getDependencyPackageJson,
          });
        }),
      );
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
      missingOnlyWarnsFor,
      invalidOnlyWarnsFor,
      internalMissingConfigName = 'missingOnlyWarnsFor',
      internalInvalidConfigName = 'invalidOnlyWarnsFor',
    } = {}) {
      jobs.push(
        new Job(this.checkDirectPeerDependencies.name, async () => {
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
          await checkDirectPeerDependencies(
            isPkgLibrary,
            pkg,
            pkgPathName,
            getDependencyPackageJson,
            missingOnlyWarnsForCheck,
            invalidOnlyWarnsForCheck,
          );
        }),
      );
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = 'onlyWarnsFor',
    } = {}) {
      jobs.push(
        new Job(this.checkDirectDuplicateDependencies.name, async () => {
          await checkDirectDuplicateDependencies(
            pkg,
            pkgPathName,
            isPkgLibrary,
            'dependencies',
            getDependencyPackageJson,
            createOnlyWarnsForMappingCheck(internalConfigName, onlyWarnsFor),
          );
        }),
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
      onlyWarnsForInPackage,
      onlyWarnsForInDependencies,
      allowRangeVersionsInDependencies = isPkgLibrary,
      internalExactVersionsIgnore,
      checkResolutionMessage,
    } = {}) {
      let internalMissingPeerDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        {};
      let internalInvalidPeerDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        {};
      let internalDirectDuplicateDependenciesOnlyWarnsFor: OnlyWarnsForOptionalDependencyMapping =
        {};

      const exactVersionsOnlyWarnsFor =
        onlyWarnsForInPackage?.exactVersions || [];

      if (onlyWarnsForInDependencies) {
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
        missingOnlyWarnsFor: internalMissingPeerDependenciesOnlyWarnsFor,
        invalidOnlyWarnsFor: internalInvalidPeerDependenciesOnlyWarnsFor,
        internalMissingConfigName:
          'onlyWarnsForInDependencies.missingPeerDependency',
        internalInvalidConfigName:
          'onlyWarnsForInDependencies.invalidPeerDependencyVersion',
      });

      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
        internalConfigName:
          'onlyWarnsForInDependencies.duplicateDirectDependency',
      });

      if (isPkgLibrary) {
        this.checkMinRangeDependenciesSatisfiesDevDependencies();
      }

      return this;
    },

    checkIdenticalVersionsThanDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      jobs.push(
        new Job(this.checkIdenticalVersionsThanDependency.name, async () => {
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
        }),
      );
      return this;
    },

    checkIdenticalVersionsThanDevDependencyOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsFromDependency.name, async () => {
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
        }),
      );
      return this;
    },

    checkSatisfiesVersions(dependencies) {
      Object.entries(dependencies).forEach(
        ([dependencyType, dependenciesRanges]) => {
          checkSatisfiesVersions(
            pkg,
            pkgPathName,
            dependencyType as DependencyTypes,
            dependenciesRanges,
          );
        },
      );
      return this;
    },

    checkSatisfiesVersionsFromDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsFromDependency.name, async () => {
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
        }),
      );
      return this;
    },

    checkSatisfiesVersionsInDevDependenciesOfDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      jobs.push(
        new Job(
          this.checkSatisfiesVersionsInDevDependenciesOfDependency.name,
          async () => {
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
          },
        ),
      );
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
      jobs.push(
        new Job(
          this.checkSatisfiesVersionsBetweenDependencies.name,
          async () => {
            const [depPkg1, depPkg2] = await Promise.all([
              getDependencyPackageJson(depName1),
              getDependencyPackageJson(depName2),
            ]);

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
          },
        ),
      );
      return this;
    },

    checkSatisfiesVersionsInDependency(depName, dependenciesRanges) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, async () => {
          const depPkg = getDependencyPackageJson(depName);
          checkSatisfiesVersionsInDependency(
            pkgPathName,
            depPkg,
            dependenciesRanges,
          );
        }),
      );
      return this;
    },

    checkMinRangeDependenciesSatisfiesDevDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, async () => {
          checkMinRangeSatisfies(
            pkgPathName,
            pkg,
            'dependencies',
            'devDependencies',
            { tryToAutoFix },
          );
        }),
      );
      return this;
    },
  };
}
