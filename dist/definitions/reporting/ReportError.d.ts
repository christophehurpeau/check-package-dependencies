import type { DependencyValue, Location } from "../utils/packageTypes.ts";
export interface ReportErrorDetails {
    errorMessage: string;
    errorDetails?: string;
    errorTarget?: "dependencyName" | "dependencyValue";
    dependency?: Omit<Partial<DependencyValue>, "name"> & Pick<DependencyValue, "name">;
    onlyWarns?: boolean;
    /** @deprecated use fixTo instead */
    autoFixable?: boolean;
    fixTo?: string;
}
export type ReportError = (details: ReportErrorDetails) => void;
export type CreateReportError = (ruleName: string, pkgPathName: string) => ReportError;
export declare const getLocFromDependency: (dependency: Partial<DependencyValue>, errorTarget: ReportErrorDetails["errorTarget"]) => Location | undefined;
//# sourceMappingURL=ReportError.d.ts.map