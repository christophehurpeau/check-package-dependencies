import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
export interface CheckMinRangeSatisfiesOptions {
    customCreateReportError?: typeof createReportError;
    tryToAutoFix?: boolean;
}
export declare function checkMinRangeSatisfies(pkg: ParsedPackageJson, type1?: DependencyTypes, type2?: DependencyTypes, { tryToAutoFix, customCreateReportError, }?: CheckMinRangeSatisfiesOptions): void;
//# sourceMappingURL=checkMinRangeSatisfies.d.ts.map