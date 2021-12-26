import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
export interface CheckExactVersionsOptions {
    onlyWarnsFor?: string[];
    tryToAutoFix?: boolean;
}
export declare function checkExactVersions(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, { onlyWarnsFor, tryToAutoFix }?: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map