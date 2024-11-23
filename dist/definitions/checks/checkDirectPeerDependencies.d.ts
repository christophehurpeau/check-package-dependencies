import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson";
import { createReportError } from "../utils/createReportError";
import type { PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils";
export declare function checkDirectPeerDependencies(isLibrary: boolean, pkg: PackageJson, pkgPathName: string, getDependencyPackageJson: GetDependencyPackageJson, missingOnlyWarnsForCheck: OnlyWarnsForMappingCheck, invalidOnlyWarnsForCheck: OnlyWarnsForMappingCheck, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkDirectPeerDependencies.d.ts.map