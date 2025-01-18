import type { Except, PackageJson } from "type-fest";
import type { CheckPackageApi, CreateCheckPackageOptions, OnlyWarnsForInDependenciesCheckPackageRecommendedOption, OnlyWarnsForInDependencyCheckPackageRecommendedOption, OnlyWarnsForInPackageCheckPackageRecommendedOption } from "./check-package.ts";
import type { CheckResolutionMessage } from "./checks/checkResolutionsHasExplanation.ts";
import type { OnlyWarnsForOptionalDependencyMapping } from "./utils/warnForUtils.ts";
interface OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption extends OnlyWarnsForInPackageCheckPackageRecommendedOption {
    duplicateDirectDependency: OnlyWarnsForInDependencyCheckPackageRecommendedOption["duplicateDirectDependency"];
}
type OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption = Record<"*" | string, OnlyWarnsForInMonorepoPackageCheckPackageRecommendedOption>;
type OnlyWarnsForInMonorepoPackagesDependenciesCheckPackageRecommendedOption = Record<string, OnlyWarnsForInDependenciesCheckPackageRecommendedOption>;
export interface CheckPackageWithWorkspacesRecommendedOptions {
    allowRangeVersionsInLibraries?: boolean;
    monorepoDirectDuplicateDependenciesOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
    monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
    monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor?: OnlyWarnsForOptionalDependencyMapping;
    onlyWarnsForInRootPackage?: OnlyWarnsForInPackageCheckPackageRecommendedOption;
    onlyWarnsForInMonorepoPackages?: OnlyWarnsForInMonorepoPackagesCheckPackageRecommendedOption;
    onlyWarnsForInRootDependencies?: OnlyWarnsForInDependenciesCheckPackageRecommendedOption;
    onlyWarnsForInMonorepoPackagesDependencies?: OnlyWarnsForInMonorepoPackagesDependenciesCheckPackageRecommendedOption;
    checkResolutionMessage?: CheckResolutionMessage;
}
export interface CheckPackageWithWorkspacesApi {
    run: () => Promise<void>;
    checkRecommended: (options?: CheckPackageWithWorkspacesRecommendedOptions) => CheckPackageWithWorkspacesApi;
    forRoot: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    forEach: (callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
    for: (id: string, callback: (checkPackage: CheckPackageApi) => void) => CheckPackageWithWorkspacesApi;
}
interface CreateCheckPackageWithWorkspacesOptions extends Except<CreateCheckPackageOptions, "isLibrary"> {
    isLibrary?: (pkg: PackageJson) => boolean;
}
export declare function createCheckPackageWithWorkspaces({ createReportError, ...createCheckPackageOptions }?: CreateCheckPackageWithWorkspacesOptions): CheckPackageWithWorkspacesApi;
export {};
//# sourceMappingURL=check-package-with-workspaces.d.ts.map