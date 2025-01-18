import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkSatisfiesVersions(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, dependenciesRanges: Record<string, string>, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkSatisfiesVersions.d.ts.map