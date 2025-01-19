import type { PackageJson } from "type-fest";
import type { DependencyTypes } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck, OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import type { ReportError, ReportErrorDetails } from "./ReportError.ts";
type ReportErrorWithRuleName = ReportErrorDetails & {
    ruleName: string;
};
export declare function logMessage(message: ReportErrorWithRuleName): void;
export declare function displayMessages(): void;
export declare function createCliReportError(ruleName: string, pkgPathName: string): ReportError;
export declare function reportNotWarnedFor(reportError: ReportError, onlyWarnsForCheck: OnlyWarnsForCheck): void;
export declare function reportNotWarnedForMapping(reportError: ReportError, onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck): void;
export declare function resetMessages(): void;
export declare function fromDependency(depPkg: PackageJson, depType?: DependencyTypes): string;
export declare function inDependency(depPkg: PackageJson, depType?: DependencyTypes): string;
export {};
//# sourceMappingURL=cliErrorReporting.d.ts.map