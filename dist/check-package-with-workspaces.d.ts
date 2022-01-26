import type { CheckPackageApi } from './check-package';
import type { CheckResolutionMessage } from './checks/checkResolutionsHasExplanation';
export interface CheckPackageWithWorkspacesRecommendedOptions {
    isLibrary?: (pkgName: string) => boolean;
    allowRangeVersionsInLibraries?: boolean;
    peerDependenciesOnlyWarnsFor?: string[];
    directDuplicateDependenciesOnlyWarnsFor?: string[];
    monorepoDirectDuplicateDependenciesOnlyWarnsFor?: string[];
    checkResolutionMessage?: CheckResolutionMessage;
}
export interface CheckPackageWithWorkspacesApi {
    checkRecommended: (options?: CheckPackageWithWorkspacesRecommendedOptions) => CheckPackageWithWorkspacesApi;
    forRoot: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    forEach: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    for: (id: string, callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
}
export declare function createCheckPackageWithWorkspaces(pkgDirectoryPath?: string): CheckPackageWithWorkspacesApi;
//# sourceMappingURL=check-package-with-workspaces.d.ts.map