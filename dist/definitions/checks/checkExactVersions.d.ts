import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckExactVersionsOptions {
    getDependencyPackageJson?: GetDependencyPackageJson;
    onlyWarnsForCheck: OnlyWarnsForCheck;
}
export declare function checkExactVersion(reportError: ReportError, dependencyValue: DependencyValue, { getDependencyPackageJson, onlyWarnsForCheck }: CheckExactVersionsOptions): void;
//# sourceMappingURL=checkExactVersions.d.ts.map