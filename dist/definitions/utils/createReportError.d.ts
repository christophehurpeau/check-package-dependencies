import type { OnlyWarnsForCheck, OnlyWarnsForMappingCheck } from "./warnForUtils";
export type ReportError = (msgTitle: string, msgInfo?: string, onlyWarns?: boolean, autoFixable?: boolean) => void;
export declare function displayConclusion(): void;
export declare function logMessage(msgTitle: string, msgInfo?: string, onlyWarns?: boolean, autoFixable?: boolean): void;
export declare function createReportError(title: string, pkgPathName: string): ReportError;
export declare function reportNotWarnedFor(reportError: ReportError, onlyWarnsForCheck: OnlyWarnsForCheck): void;
export declare function reportNotWarnedForMapping(reportError: ReportError, onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck): void;
//# sourceMappingURL=createReportError.d.ts.map