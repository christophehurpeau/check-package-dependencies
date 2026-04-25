import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function isVersionSatisfiesRange(version: string, range: string): boolean;
export declare function checkSatisfiesVersion(reportError: ReportError, dependencyValue: DependencyValue, range: string, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
export declare function checkMissingSatisfiesVersions(reportError: ReportError, pkg: ParsedPackageJson, acceptedTypes: DependencyTypes | DependencyTypes[], dependenciesRanges: Record<string, string>, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
export declare function checkSatisfiesVersions(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, dependenciesRanges: Record<string, string>, onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkSatisfiesVersions.d.ts.map