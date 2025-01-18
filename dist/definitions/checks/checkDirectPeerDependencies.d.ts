import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson, RegularDependencyTypes } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare const regularDependencyTypes: RegularDependencyTypes[];
export declare function checkDirectPeerDependencies(reportError: ReportError, isLibrary: boolean, pkg: ParsedPackageJson, getDependencyPackageJson: GetDependencyPackageJson, missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck, invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck): void;
//# sourceMappingURL=checkDirectPeerDependencies.d.ts.map