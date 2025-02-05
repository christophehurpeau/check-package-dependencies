import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
export declare function checkResolutionVersionMatch(reportError: ReportError, pkg: ParsedPackageJson, resolutionValue: DependencyValue, { tryToAutoFix }?: CheckResolutionsVersionsMatchOptions): void;
export interface CheckResolutionsVersionsMatchOptions {
    tryToAutoFix?: boolean;
}
export declare function checkResolutionsVersionsMatch(reportError: ReportError, pkg: ParsedPackageJson, { tryToAutoFix }?: CheckResolutionsVersionsMatchOptions): void;
//# sourceMappingURL=checkResolutionsVersionsMatch.d.ts.map