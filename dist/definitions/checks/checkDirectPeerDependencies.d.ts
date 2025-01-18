import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkDirectPeerDependencies(reportError: ReportError, isLibrary: boolean, pkg: ParsedPackageJson, getDependencyPackageJson: GetDependencyPackageJson, missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck, invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck): void;
//# sourceMappingURL=checkDirectPeerDependencies.d.ts.map