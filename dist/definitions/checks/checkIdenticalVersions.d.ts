import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";
export declare function checkIdenticalVersions(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, deps: Record<string, Partial<Record<DependencyTypes, string[]>> | string[]>, onlyWarnsForCheck?: OnlyWarnsForCheck, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkIdenticalVersions.d.ts.map