import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkPeerDependencies(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, allowedPeerIn: DependencyTypes[], allowMissing: boolean, providedDependencies: [string, string][], depPkg: PackageJson, missingOnlyWarnsForCheck: OnlyWarnsForCheck, invalidOnlyWarnsForCheck: OnlyWarnsForCheck): void;
//# sourceMappingURL=checkPeerDependencies.d.ts.map