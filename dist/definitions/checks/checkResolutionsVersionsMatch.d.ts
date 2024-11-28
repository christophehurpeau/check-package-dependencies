import { createReportError } from "../utils/createReportError.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
export interface CheckResolutionsVersionsMatchOptions {
    tryToAutoFix?: boolean;
    customCreateReportError?: typeof createReportError;
}
export declare function checkResolutionsVersionsMatch(pkg: PackageJson, pkgPathName: string, { tryToAutoFix, customCreateReportError, }?: CheckResolutionsVersionsMatchOptions): void;
//# sourceMappingURL=checkResolutionsVersionsMatch.d.ts.map