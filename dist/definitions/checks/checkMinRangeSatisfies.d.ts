import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
export interface CheckMinRangeSatisfiesOptions {
    tryToAutoFix?: boolean;
}
export declare function checkMinRangeSatisfies(reportError: ReportError, pkg: ParsedPackageJson, type1?: DependencyTypes, type2?: DependencyTypes, { tryToAutoFix }?: CheckMinRangeSatisfiesOptions): void;
//# sourceMappingURL=checkMinRangeSatisfies.d.ts.map