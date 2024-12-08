import type { Except, PackageJson } from "type-fest";
import type { DependencyTypes, DependencyValue } from "./packageTypes.ts";
import type { OnlyWarnsForCheck, OnlyWarnsForMappingCheck } from "./warnForUtils.ts";
export interface ReportErrorMessage {
    ruleName: string;
    errorMessage: string;
    errorDetails?: string;
    dependency?: Omit<Partial<DependencyValue>, "name"> & Pick<DependencyValue, "name">;
    onlyWarns?: boolean;
    autoFixable?: boolean;
}
export type ReportError = (message: Except<ReportErrorMessage, "ruleName">) => void;
export declare function logMessage(message: ReportErrorMessage): void;
export declare function displayMessages(): void;
export declare function createReportError(ruleName: string, pkgPathName: string): ReportError;
export declare function reportNotWarnedFor(reportError: ReportError, onlyWarnsForCheck: OnlyWarnsForCheck): void;
export declare function reportNotWarnedForMapping(reportError: ReportError, onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck): void;
export declare function resetMessages(): void;
export declare function fromDependency(depPkg: PackageJson, depType?: DependencyTypes): string;
export declare function inDependency(depPkg: PackageJson, depType?: DependencyTypes): string;
//# sourceMappingURL=createReportError.d.ts.map