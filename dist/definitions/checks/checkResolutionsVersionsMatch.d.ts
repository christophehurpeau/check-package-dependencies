import { createReportError } from "../utils/createReportError.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
export interface CheckResolutionsVersionsMatchOptions {
    tryToAutoFix?: boolean;
    customCreateReportError?: typeof createReportError;
}
export declare function checkResolutionsVersionsMatch(pkg: ParsedPackageJson, { tryToAutoFix, customCreateReportError, }?: CheckResolutionsVersionsMatchOptions): void;
//# sourceMappingURL=checkResolutionsVersionsMatch.d.ts.map