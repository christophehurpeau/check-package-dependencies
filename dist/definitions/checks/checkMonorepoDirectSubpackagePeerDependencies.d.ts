import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkMonorepoDirectSubpackagePeerDependencies(reportError: ReportError, isLibrary: boolean, monorepoPkg: ParsedPackageJson, subpackagePkg: ParsedPackageJson, getDependencyPackageJson: GetDependencyPackageJson, invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck, missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck): void;
//# sourceMappingURL=checkMonorepoDirectSubpackagePeerDependencies.d.ts.map