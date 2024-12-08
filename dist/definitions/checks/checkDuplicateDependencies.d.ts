import type { ReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkDuplicateDependencies(reportError: ReportError, pkg: ParsedPackageJson, isPkgLibrary: boolean, depType: DependencyTypes, searchIn: DependencyTypes[], depPkg: PackageJson, onlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkDuplicateDependencies.d.ts.map