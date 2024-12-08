import type { ReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkPeerDependencies(pkg: ParsedPackageJson, reportError: ReportError, type: DependencyTypes, allowedPeerIn: DependencyTypes[], allowMissing: boolean, providedDependencies: [string, string][], depPkg: PackageJson, missingOnlyWarnsForCheck: OnlyWarnsForCheck, invalidOnlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkPeerDependencies.d.ts.map