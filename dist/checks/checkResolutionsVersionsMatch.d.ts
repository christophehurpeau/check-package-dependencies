import type { PackageJson } from '../utils/packageTypes';
export interface CheckResolutionsVersionsMatchOptions {
    tryToAutoFix?: boolean;
}
export declare function checkResolutionsVersionsMatch(pkg: PackageJson, pkgPathName: string, { tryToAutoFix }?: CheckResolutionsVersionsMatchOptions): void;
//# sourceMappingURL=checkResolutionsVersionsMatch.d.ts.map