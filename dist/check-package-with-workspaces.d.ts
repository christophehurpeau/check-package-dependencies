import type { CreateCheckPackageOptions, CheckPackageApi, OnlyWarnsForInDependenciesCheckPackageRecommendedOption, OnlyWarnsForInDependencyCheckPackageRecommendedOption, OnlyWarnsForInPackageCheckPackageRecommendedOption } from './check-package';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
import type { OnlyWarnsFor, OnlyWarnsForOptionalDependencyMapping } from './utils/warnForUtils';
interface OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption extends OnlyWarnsForInPackageCheckPackageRecommendedOption {
    duplicateDirectDependency: OnlyWarnsForInDependencyCheckPackageRecommendedOption['duplicateDirectDependency'];
}
declare type OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption = Record<'*' | string, OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption>;
export interface CheckPackageWithWorkspacesRecommendedOptions {
    isLibrary?: (pkgName: string) => boolean;
    allowRangeVersionsInLibraries?: boolean;
    /** @deprecated use onlyWarnsFor */
    peerDependenciesOnlyWarnsFor?: OnlyWarnsFor;
    /** @deprecated use onlyWarnsFor */
    directDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsFor;
    monorepoDirectDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
    onlyWarnsForInRootPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
    onlyWarnsForInMonorepoPackages?: OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption;
    onlyWarnsForInDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
    checkResolutionMessage?: CheckResolutionMessage;
}
export interface CheckPackageWithWorkspacesApi {
    checkRecommended: (options?: CheckPackageWithWorkspacesRecommendedOptions) => CheckPackageWithWorkspacesApi;
    forRoot: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    forEach: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    for: (id: string, callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
}
export declare function createCheckPackageWithWorkspaces(pkgDirectoryPath?: string, createCheckPackageOptions?: CreateCheckPackageOptions): CheckPackageWithWorkspacesApi;
export {};
//# sourceMappingURL=check-package-with-workspaces.d.ts.map