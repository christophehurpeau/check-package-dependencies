import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkIdenticalVersions(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, deps: Record<string, Partial<Record<DependencyTypes, string[]>> | string[]>, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkIdenticalVersions.d.ts.map