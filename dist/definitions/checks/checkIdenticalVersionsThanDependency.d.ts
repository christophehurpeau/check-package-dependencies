import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export declare function checkIdenticalVersionsThanDependency(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, dependencies?: PackageJson[DependencyTypes], { onlyWarnsForCheck, comment, }?: Commented & {
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}): void;
//# sourceMappingURL=checkIdenticalVersionsThanDependency.d.ts.map