import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkIdenticalVersionsThanDependency(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, dependencies?: PackageJson[DependencyTypes], onlyWarnsForCheck?: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkIdenticalVersionsThanDependency.d.ts.map