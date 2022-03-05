import type { OnlyWarnsFor } from 'utils/shouldOnlyWarnFor';
import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsFor?: OnlyWarnsFor;
    tryToAutoFix?: boolean;
}
export declare function checkExactVersions(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, { getDependencyPackageJson, onlyWarnsFor, tryToAutoFix, }?: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map