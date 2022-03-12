import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    tryToAutoFix?: boolean;
}
export declare function checkExactVersions(pkg: PackageJson, pkgPathName: string, types: DependencyTypes[], { getDependencyPackageJson, onlyWarnsForCheck, tryToAutoFix, }: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map