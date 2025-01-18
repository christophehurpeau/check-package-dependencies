import type { ReportError } from "../reporting/ReportError.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
export interface CheckResolutionsVersionsMatchOptions {
    tryToAutoFix?: boolean;
}
export declare function checkResolutionsVersionsMatch(reportError: ReportError, pkg: ParsedPackageJson, { tryToAutoFix }?: CheckResolutionsVersionsMatchOptions): void;
//# sourceMappingURL=checkResolutionsVersionsMatch.d.ts.map