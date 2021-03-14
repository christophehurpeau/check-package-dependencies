import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import type { GetDependencyPackageJson } from './utils/createGetDependencyPackageJson';
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
}
export declare function createCheckPackage(pkgDirectoryPath?: string): CheckPackageApi;
//# sourceMappingURL=check-package.d.ts.map