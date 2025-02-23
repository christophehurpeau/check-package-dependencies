import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
export declare function checkDependencyMinRangeSatisfies(reportError: ReportError, dependencyValue: DependencyValue, pkg: ParsedPackageJson, dependencyType2: DependencyTypes): void;
export interface CheckMinRangeSatisfiesOptions {
    tryToAutoFix?: boolean;
}
export declare function checkMinRangeSatisfies(reportError: ReportError, pkg: ParsedPackageJson, type1?: DependencyTypes, type2?: DependencyTypes, { tryToAutoFix }?: CheckMinRangeSatisfiesOptions): void;
//# sourceMappingURL=checkMinRangeSatisfies.d.ts.map