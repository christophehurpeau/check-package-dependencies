import path from "node:path";
import util from "node:util";
import type { SetRequired } from "type-fest";
import { checkDirectDuplicateDependencies } from "./checks/checkDirectDuplicateDependencies.ts";
import { checkDirectPeerDependencies } from "./checks/checkDirectPeerDependencies.ts";
import { checkExactVersions } from "./checks/checkExactVersions.ts";
import { checkIdenticalVersions } from "./checks/checkIdenticalVersions.ts";
import { checkIdenticalVersionsThanDependency } from "./checks/checkIdenticalVersionsThanDependency.ts";
import { checkMinRangeSatisfies } from "./checks/checkMinRangeSatisfies.ts";
import { checkNoDependencies } from "./checks/checkNoDependencies.ts";
import type { CheckResolutionMessage } from "./checks/checkResolutionsHasExplanation.ts";
import { checkResolutionsHasExplanation } from "./checks/checkResolutionsHasExplanation.ts";
import { checkResolutionsVersionsMatch } from "./checks/checkResolutionsVersionsMatch.ts";
import { checkSatisfiesVersions } from "./checks/checkSatisfiesVersions.ts";
import { checkSatisfiesVersionsBetweenDependencies } from "./checks/checkSatisfiesVersionsBetweenDependencies.ts";
import { checkSatisfiesVersionsFromDependency } from "./checks/checkSatisfiesVersionsFromDependency.ts";
import { checkSatisfiesVersionsInDependency } from "./checks/checkSatisfiesVersionsInDependency.ts";
import type { CreateReportError } from "./reporting/ReportError.ts";
import {
  createCliReportError,
  displayMessages,
  reportNotWarnedForMapping,
} from "./reporting/cliErrorReporting.ts";
import type { GetDependencyPackageJson } from "./utils/createGetDependencyPackageJson.ts";
import { createGetDependencyPackageJson } from "./utils/createGetDependencyPackageJson.ts";
import { getEntries } from "./utils/object.ts";
import type {
  DependenciesRanges,
  DependencyName,
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
} from "./utils/packageTypes.ts";
import { readAndParsePkgJson, writePkgJson } from "./utils/pkgJsonUtils.ts";
import type {
  OnlyWarnsFor,
  OnlyWarnsForDependencyMapping,
  OnlyWarnsForOptionalDependencyMapping,
} from "./utils/warnForUtils.ts";
import {
  createOnlyWarnsForArrayCheck,
  createOnlyWarnsForMappingCheck,
} from "./utils/warnForUtils.ts";

export interface CreateCheckPackageOptions {
  packageDirectoryPath?: string;
  isLibrary?: boolean | ((pkg: PackageJson) => boolean);
  /** @internal */
  internalWorkspacePkgDirectoryPath?: string;
  /** @internal */
  createReportError?: CreateReportError;
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
  "*" | string,
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
  skipDisplayMessages?: boolean;
}

export interface CheckPackageApi {
  run: (options?: CheckPackageApiRunOptions) => Promise<void>;
  runSync: (options?: CheckPackageApiRunOptions) => void;

  /** @internal */
  parsedPkg: ParsedPackageJson;
  /** @internal */
  pkg: SetRequired<PackageJson, "name">;
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
    config: Record<
      string, // depName1
      {
        dependencies?: Record<
          string, // depName2
          {
            dependencies?: string[];
            devDependencies?: string[];
          }
        >;
        devDependencies?: Record<
          string, // depName2
          {
            dependencies?: string[];
            devDependencies?: string[];
          }
        >;
      }
    >,
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
  checkMinRangePeerDependenciesSatisfiesDependencies: () => CheckPackageApi;
}

export type ShouldHaveExactVersions = (depType: DependencyTypes) => boolean;

export function createCheckPackage({
  packageDirectoryPath = ".",
  internalWorkspacePkgDirectoryPath,
  isLibrary = false,
  createReportError = createCliReportError,
}: CreateCheckPackageOptions = {}): CheckPackageApi {
  const pkgDirname = path.resolve(packageDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${packageDirectoryPath}/package.json`;
  const parsedPkg = readAndParsePkgJson(pkgPath);
  const copyPkg: PackageJson = JSON.parse(
    JSON.stringify(parsedPkg.value),
  ) as PackageJson;
  const isPkgLibrary =
    typeof isLibrary === "function" ? isLibrary(parsedPkg.value) : isLibrary;
  const shouldHaveExactVersions: ShouldHaveExactVersions = (depType) =>
    !isPkgLibrary ? true : depType === "devDependencies";

  let tryToAutoFix = false;

  if (process.argv.slice(2).includes("--fix")) {
    tryToAutoFix = true;
  }

  const writePackageIfChanged = (): void => {
    if (!tryToAutoFix) return;
    if (util.isDeepStrictEqual(parsedPkg.value, copyPkg)) return;
    writePkgJson(pkgPath, parsedPkg.value);
  };

  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname,
  });

  let runCalled = false;

  if (!internalWorkspacePkgDirectoryPath) {
    process.on("beforeExit", () => {
      if (!runCalled) {
        throw new Error("Call .run() and await the result.");
      }
    });
  }

  class Job {
    name: string;

    fn: () => Promise<void> | void;

    constructor(name: string, fn: () => Promise<void> | void) {
      this.name = name;
      this.fn = fn;
    }

    async run(): Promise<void> {
      try {
        await this.fn();
      } catch (error) {
        throw new Error(`${this.name} failed: ${(error as Error).message}`);
      }
    }

    runSync(): void {
      const result = this.fn();
      if (result instanceof Promise) {
        throw new TypeError(`${this.name} failed: Promise returned`);
      }
    }
  }

  const jobs: Job[] = [];

  return {
    async run({ skipDisplayMessages = false }: CheckPackageApiRunOptions = {}) {
      runCalled = true;
      // TODO parallel
      for (const job of jobs) {
        await job.run();
      }
      if (tryToAutoFix) {
        writePackageIfChanged();
      }
      if (!skipDisplayMessages) {
        displayMessages();
      }
    },

    runSync({ skipDisplayMessages = false }: CheckPackageApiRunOptions = {}) {
      for (const job of jobs) {
        job.runSync();
      }
      if (tryToAutoFix) {
        writePackageIfChanged();
      }
      if (!skipDisplayMessages) {
        displayMessages();
      }
    },

    parsedPkg,
    pkg: parsedPkg.value as SetRequired<PackageJson, "name">,
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
        new Job(this.checkExactVersions.name, () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactVersions.onlyWarnsFor",
            onlyWarnsFor,
          );
          checkExactVersions(
            createReportError("Exact versions", parsedPkg.path),
            parsedPkg,
            !allowRangeVersionsInDependencies
              ? ["dependencies", "devDependencies", "resolutions"]
              : ["devDependencies", "resolutions"],
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
      const reportError = createReportError(
        "Resolutions match other dependencies",
        parsedPkg.path,
      );
      checkResolutionsVersionsMatch(reportError, parsedPkg, {
        tryToAutoFix,
      });
      return this;
    },

    checkExactDevVersions({ onlyWarnsFor } = {}) {
      jobs.push(
        new Job(this.checkExactDevVersions.name, () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactDevVersions.onlyWarnsFor",
            onlyWarnsFor,
          );
          checkExactVersions(
            createReportError("Exact dev versions", parsedPkg.path),
            parsedPkg,
            ["devDependencies"],
            {
              onlyWarnsForCheck,
              tryToAutoFix,
              getDependencyPackageJson,
            },
          );
        }),
      );
      return this;
    },

    checkNoDependencies(
      type = "dependencies",
      moveToSuggestion = "devDependencies",
    ) {
      const reportError = createReportError("No dependencies", parsedPkg.path);
      checkNoDependencies(reportError, parsedPkg, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({
      missingOnlyWarnsFor,
      invalidOnlyWarnsFor,
      internalMissingConfigName = "missingOnlyWarnsFor",
      internalInvalidConfigName = "invalidOnlyWarnsFor",
    } = {}) {
      jobs.push(
        new Job(this.checkDirectPeerDependencies.name, () => {
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
          const reportError = createReportError(
            "Peer Dependencies",
            parsedPkg.path,
          );
          checkDirectPeerDependencies(
            reportError,
            isPkgLibrary,
            parsedPkg,
            getDependencyPackageJson,
            missingOnlyWarnsForCheck,
            invalidOnlyWarnsForCheck,
          );

          reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
          if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
            reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
          }
        }),
      );
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = "onlyWarnsFor",
    } = {}) {
      jobs.push(
        new Job(this.checkDirectDuplicateDependencies.name, () => {
          checkDirectDuplicateDependencies(
            createReportError("Direct Duplicate Dependencies", parsedPkg.path),
            parsedPkg,
            isPkgLibrary,
            "dependencies",
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
      const reportError = createReportError(
        "Resolutions has explanation",
        parsedPkg.path,
      );
      checkResolutionsHasExplanation(
        reportError,
        parsedPkg,
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
          "onlyWarnsForInDependencies.missingPeerDependency",
        internalInvalidConfigName:
          "onlyWarnsForInDependencies.invalidPeerDependencyVersion",
      });

      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
        internalConfigName:
          "onlyWarnsForInDependencies.duplicateDirectDependency",
      });

      if (isPkgLibrary) {
        this.checkMinRangeDependenciesSatisfiesDevDependencies();
        this.checkMinRangePeerDependenciesSatisfiesDependencies();
      }

      return this;
    },

    checkIdenticalVersionsThanDependency(
      depName,
      { resolutions, dependencies, devDependencies },
    ) {
      jobs.push(
        new Job(this.checkIdenticalVersionsThanDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            `Same Versions than ${depPkg.name || ""}`,
            parsedPkg.path,
          );
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.dependencies,
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.dependencies,
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "devDependencies",
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
        new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            `Same Versions than ${depPkg.name || ""}`,
            parsedPkg.path,
          );
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.devDependencies,
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.devDependencies,
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "devDependencies",
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
      const reportError = createReportError(
        "Satisfies Versions",
        parsedPkg.path,
      );
      Object.entries(dependencies).forEach(
        ([dependencyType, dependenciesRanges]) => {
          checkSatisfiesVersions(
            reportError,
            parsedPkg,
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
        new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
          const reportError = createReportError(
            "Satisfies Versions From Dependency",
            parsedPkg.path,
          );
          const [depPkg] = getDependencyPackageJson(depName);
          if (resolutions) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions },
            );
          }
          if (dependencies) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions },
            );
          }
          if (devDependencies) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
              "devDependencies",
              devDependencies,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions },
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
          () => {
            const reportError = createReportError(
              "Satisfies Versions In Dev Dependencies Of Dependency",
              parsedPkg.path,
            );
            const [depPkg] = getDependencyPackageJson(depName);
            if (resolutions) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
                "resolutions",
                resolutions,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions },
              );
            }
            if (dependencies) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
                "dependencies",
                dependencies,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions },
              );
            }
            if (devDependencies) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
                "devDependencies",
                devDependencies,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions },
              );
            }
          },
        ),
      );
      return this;
    },

    checkIdenticalVersions({ resolutions, dependencies, devDependencies }) {
      const reportError = createReportError(
        "Identical Versions",
        parsedPkg.path,
      );
      if (resolutions) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "resolutions",
          resolutions,
        );
      }
      if (dependencies) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "dependencies",
          dependencies,
        );
      }
      if (devDependencies) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "devDependencies",
          devDependencies,
        );
      }
      return this;
    },

    checkSatisfiesVersionsBetweenDependencies(config) {
      jobs.push(
        new Job(
          this.checkSatisfiesVersionsBetweenDependencies.name,
          async () => {
            const depNamesLvl1 = Object.keys(config);
            const depNamesLvl2 = Object.values(config).flatMap((depConfig) => [
              ...Object.keys(depConfig.dependencies || {}),
              ...Object.keys(depConfig.devDependencies || {}),
            ]);
            const uniqueDepNames = [
              ...new Set([...depNamesLvl1, ...depNamesLvl2]),
            ];
            const depPkgsByName = new Map<
              string,
              ReturnType<typeof getDependencyPackageJson>
            >(
              await Promise.all(
                uniqueDepNames.map(
                  (depName) =>
                    [depName, getDependencyPackageJson(depName)] as const,
                ),
              ),
            );

            Object.entries(config).forEach(([depName1, depConfig1]) => {
              const [depPkg1, depPkgPath1] = depPkgsByName.get(depName1)!;
              (["dependencies", "devDependencies"] as const).forEach(
                (dep1Type) => {
                  Object.entries(depConfig1[dep1Type] || {}).forEach(
                    ([depName2, depConfig2]) => {
                      if (!depConfig2) return;
                      const [depPkg2] = depPkgsByName.get(depName2)!;
                      (["dependencies", "devDependencies"] as const).forEach(
                        (dep2Type) => {
                          const reportError = createReportError(
                            "Satisfies Versions From Dependency",
                            depPkgPath1,
                          );

                          checkSatisfiesVersionsBetweenDependencies(
                            reportError,
                            depPkg1,
                            dep1Type,
                            depConfig2[dep2Type] || [],
                            depPkg2,
                            dep2Type,
                            { shouldHaveExactVersions },
                          );
                        },
                      );
                    },
                  );
                },
              );
            });
          },
        ),
      );
      return this;
    },

    checkSatisfiesVersionsInDependency(depName, dependenciesRanges) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            "Satisfies Versions In Dependency",
            parsedPkg.path,
          );
          checkSatisfiesVersionsInDependency(
            reportError,
            depPkg,
            dependenciesRanges,
          );
        }),
      );
      return this;
    },

    checkMinRangeDependenciesSatisfiesDevDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const reportError = createReportError(
            '"dependencies" minimum range satisfies "devDependencies"',
            parsedPkg.path,
          );
          checkMinRangeSatisfies(
            reportError,
            parsedPkg,
            "dependencies",
            "devDependencies",
            { tryToAutoFix },
          );
        }),
      );
      return this;
    },

    checkMinRangePeerDependenciesSatisfiesDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const reportError = createReportError(
            '"peerDependencies" minimum range satisfies "dependencies"',
            parsedPkg.path,
          );
          checkMinRangeSatisfies(
            reportError,
            parsedPkg,
            "peerDependencies",
            "dependencies",
            {
              tryToAutoFix,
            },
          );
        }),
      );
      return this;
    },
  };
}
