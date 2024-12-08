import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
export declare function checkDirectDuplicateDependencies(pkg: ParsedPackageJson, isPackageALibrary: boolean, depType: DependencyTypes, getDependencyPackageJson: GetDependencyPackageJson, onlyWarnsForCheck: OnlyWarnsForMappingCheck, reportErrorNamePrefix?: string, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkDirectDuplicateDependencies.d.ts.map