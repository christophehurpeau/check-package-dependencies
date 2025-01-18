import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkDirectDuplicateDependencies(reportError: ReportError, pkg: ParsedPackageJson, isPackageALibrary: boolean, depType: DependencyTypes, getDependencyPackageJson: GetDependencyPackageJson, onlyWarnsForCheck: OnlyWarnsForMappingCheck): void;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map