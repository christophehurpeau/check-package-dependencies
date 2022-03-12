import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import type { GetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
import type { DependencyTypes, PackageJson } from './utils/packageTypes';
import type { OnlyWarnsForOptionalDependencyMapping, OnlyWarnsFor } from './utils/warnForUtils';
export interface CreateCheckPackageOptions {
    tryToAutoFix?: boolean;
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
export declare type OnlyWarnsForInDependenciesCheckPackageRecommendedOption = Record<'*' | string, OnlyWarnsForInDependencyCheckPackageRecommendedOption>;
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
    /** function to check the value in the "resolutionExplained" key in package.json */
    checkResolutionMessage?: CheckResolutionMessage;
}
export interface CheckExactVersionsOptions {
    allowRangeVersionsInDependencies?: boolean;
    onlyWarnsFor?: OnlyWarnsFor;
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
    checkExactVersionsForLibrary: (options?: CheckExactVersionsOptions) => CheckPackageApi;
    checkExactDevVersions: (options?: CheckExactVersionsOptions) => CheckPackageApi;
    checkNoDependencies: (type?: DependencyTypes, moveToSuggestion?: DependencyTypes) => CheckPackageApi;
    checkDirectPeerDependencies: (options?: CheckDirectPeerDependenciesOptions) => CheckPackageApi;
    checkDirectDuplicateDependencies: (options?: CheckDirectDuplicateDependenciesOptions) => CheckPackageApi;
    checkResolutionsHasExplanation: (checkMessage?: CheckResolutionMessage) => CheckPackageApi;
    checkRecommended: (options?: CheckRecommendedOptions) => CheckPackageApi;
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
    checkIdenticalVersions: (dependencies: {
        resolutions?: Record<string, string[]>;
        dependencies?: Record<string, string[]>;
        devDependencies?: Record<string, string[]>;
    }) => CheckPackageApi;
    checkSatisfiesVersionsBetweenDependencies: (depName1: string, depName2: string, dependencies: {
        resolutions?: string[];
        dependencies?: string[];
        devDependencies?: string[];
    }) => CheckPackageApi;
}
export declare function createCheckPackage(pkgDirectoryPath?: string, { tryToAutoFix }?: CreateCheckPackageOptions): CheckPackageApi;
//# sourceMappingURL=check-package.d.ts.map