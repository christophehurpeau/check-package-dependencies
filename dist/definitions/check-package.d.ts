import type { SetRequired } from "type-fest";
import type { CheckResolutionMessage } from "./checks/checkResolutionsHasExplanation.ts";
import type { CreateReportError } from "./reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "./utils/createGetDependencyPackageJson.ts";
import type { DependenciesRanges, DependencyName, DependencyTypes, PackageJson, ParsedPackageJson } from "./utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForOptionalDependencyMapping } from "./utils/warnForUtils.ts";
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
    exactVersions?: OnlyWarnsFor;
}
export interface OnlyWarnsForInDependencyCheckPackageRecommendedOption {
    duplicateDirectDependency: OnlyWarnsFor;
    missingPeerDependency: OnlyWarnsFor;
    invalidPeerDependencyVersion: OnlyWarnsFor;
}
export type OnlyWarnsForInDependenciesCheckPackageRecommendedOption = Record<"*" | string, OnlyWarnsForInDependencyCheckPackageRecommendedOption>;
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
    checkExactDevVersions: (options?: CheckExactVersionsOptions) => CheckPackageApi;
    checkNoDependencies: (type?: DependencyTypes, moveToSuggestion?: DependencyTypes) => CheckPackageApi;
    /**
     * @example
     * ```
     * .checkDirectPeerDependencies({
     *   invalidOnlyWarnsFor: ['semver'],
     * })
     * ```
     */
    checkDirectPeerDependencies: (options?: CheckDirectPeerDependenciesOptions) => CheckPackageApi;
    /**
     * @example
     * ```
     * .checkDirectDuplicateDependencies({
     *   invalidOnlyWarnsFor: { '*': 'type-fest' },
     * })
     * ```
     */
    checkDirectDuplicateDependencies: (options?: CheckDirectDuplicateDependenciesOptions) => CheckPackageApi;
    checkResolutionsHasExplanation: (checkMessage?: CheckResolutionMessage) => CheckPackageApi;
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
    checkIdenticalVersionsThanDependency: (depName: string, dependencies: {
        resolutions?: string[];
        dependencies?: string[];
        devDependencies?: string[];
    }) => CheckPackageApi;
    checkIdenticalVersionsThanDevDependencyOfDependency: (depName: string, dependencies: {
        resolutions?: string[];
        dependencies?: string[];
        devDependencies?: string[];
    }) => CheckPackageApi;
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
    checkSatisfiesVersions: (dependencies: Partial<Record<DependencyTypes, Record<DependencyName, string>>>) => CheckPackageApi;
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
    checkSatisfiesVersionsFromDependency: (depName: string, dependencies: {
        resolutions?: string[];
        dependencies?: string[];
        devDependencies?: string[];
    }) => CheckPackageApi;
    checkSatisfiesVersionsInDevDependenciesOfDependency: (depName: string, dependencies: {
        resolutions?: string[];
        dependencies?: string[];
        devDependencies?: string[];
    }) => CheckPackageApi;
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
    checkSatisfiesVersionsBetweenDependencies: (config: Record<string, // depName1
    {
        dependencies?: Record<string, // depName2
        {
            dependencies?: string[];
            devDependencies?: string[];
        }>;
        devDependencies?: Record<string, // depName2
        {
            dependencies?: string[];
            devDependencies?: string[];
        }>;
    }>) => CheckPackageApi;
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
    checkSatisfiesVersionsInDependency: (depName: string, dependenciesRanges: DependenciesRanges) => CheckPackageApi;
    checkMinRangeDependenciesSatisfiesDevDependencies: () => CheckPackageApi;
    checkMinRangePeerDependenciesSatisfiesDependencies: () => CheckPackageApi;
}
export type ShouldHaveExactVersions = (depType: DependencyTypes) => boolean;
export declare function createCheckPackage({ packageDirectoryPath, internalWorkspacePkgDirectoryPath, isLibrary, createReportError, }?: CreateCheckPackageOptions): CheckPackageApi;
//# sourceMappingURL=check-package.d.ts.map