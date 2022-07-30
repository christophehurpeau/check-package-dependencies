import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsFor, OnlyWarnsForCheck } from '../utils/warnForUtils';
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    internalExactVersionsIgnore?: OnlyWarnsFor;
    tryToAutoFix?: boolean;
}
export declare function checkExactVersions(pkg: PackageJson, pkgPathName: string, types: DependencyTypes[], { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix, }: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map