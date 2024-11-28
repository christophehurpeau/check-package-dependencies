import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    internalExactVersionsIgnore?: OnlyWarnsFor;
    tryToAutoFix?: boolean;
    customCreateReportError?: typeof createReportError;
}
export declare function checkExactVersions(pkg: PackageJson, pkgPathName: string, types: DependencyTypes[], { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix, customCreateReportError, }: CheckExactVersionsOptions): Promise<void>;
//# sourceMappingURL=checkExactVersions.d.ts.map