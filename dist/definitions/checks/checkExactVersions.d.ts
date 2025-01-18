import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    internalExactVersionsIgnore?: OnlyWarnsFor;
    tryToAutoFix?: boolean;
}
export declare function checkExactVersions(reportError: ReportError, pkg: ParsedPackageJson, types: DependencyTypes[], { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix, }: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map