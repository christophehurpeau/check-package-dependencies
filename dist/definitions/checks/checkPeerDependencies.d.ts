import type { ReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";
export declare function checkPeerDependencies(pkg: PackageJson, reportError: ReportError, type: DependencyTypes, allowedPeerIn: DependencyTypes[], allowMissing: boolean, providedDependencies: [string, string][], depPkg: PackageJson, missingOnlyWarnsForCheck: OnlyWarnsForCheck, invalidOnlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkPeerDependencies.d.ts.map