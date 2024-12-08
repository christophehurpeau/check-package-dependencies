import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkDirectPeerDependencies(isLibrary: boolean, pkg: ParsedPackageJson, getDependencyPackageJson: GetDependencyPackageJson, missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck, invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkDirectPeerDependencies.d.ts.map