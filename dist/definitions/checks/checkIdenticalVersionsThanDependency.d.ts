import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkIdenticalVersionsThanDependency(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, dependencies?: PackageJson[DependencyTypes], onlyWarnsForCheck?: OnlyWarnsForCheck, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkIdenticalVersionsThanDependency.d.ts.map