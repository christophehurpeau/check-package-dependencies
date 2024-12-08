import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckSatisfiesVersionsOptions {
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersions(pkg: ParsedPackageJson, type: DependencyTypes, dependenciesRanges: Record<string, string>, onlyWarnsForCheck?: OnlyWarnsForCheck, { customCreateReportError, }?: CheckSatisfiesVersionsOptions): void;
//# sourceMappingURL=checkSatisfiesVersions.d.ts.map