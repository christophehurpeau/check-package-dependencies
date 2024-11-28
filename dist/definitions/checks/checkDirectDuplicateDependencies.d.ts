import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkDirectDuplicateDependencies(pkg: PackageJson, pkgPathName: string, isPackageALibrary: boolean, depType: DependencyTypes, getDependencyPackageJson: GetDependencyPackageJson, onlyWarnsForCheck: OnlyWarnsForMappingCheck, reportErrorNamePrefix?: string, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map