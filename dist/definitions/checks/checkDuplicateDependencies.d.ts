import type { ReportError } from "../utils/createReportError";
import type { PackageJson, DependencyTypes } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";
export declare function checkDuplicateDependencies(reportError: ReportError, pkg: PackageJson, isPkgLibrary: boolean, depType: DependencyTypes, searchIn: DependencyTypes[], depPkg: PackageJson, onlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkDuplicateDependencies.d.ts.map