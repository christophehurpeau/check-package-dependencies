import type { DependencyTypes } from "./packageTypes.ts";
import type { OnlyWarnsForCheck, OnlyWarnsForMappingCheck } from "./warnForUtils.ts";
export interface ReportErrorMessage {
    title: string;
    info?: string;
    dependency?: {
        name: string;
        origin?: DependencyTypes;
    };
    onlyWarns?: boolean;
    autoFixable?: boolean;
}
export type ReportError = (message: ReportErrorMessage) => void;
export declare function logMessage(message: ReportErrorMessage): void;
export declare function displayMessages(): void;
export declare function createReportError(title: string, pkgPathName: string): ReportError;
export declare function reportNotWarnedFor(reportError: ReportError, onlyWarnsForCheck: OnlyWarnsForCheck): void;
export declare function reportNotWarnedForMapping(reportError: ReportError, onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck): void;
export declare function resetMessages(): void;
//# sourceMappingURL=createReportError.d.ts.map