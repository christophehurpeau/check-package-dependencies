import type { ShouldHaveExactVersions } from "../check-package.ts";
import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, PackageJson, ParsedPackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckSatisfiesVersionsFromDependencyOptions {
    tryToAutoFix?: boolean;
    shouldHaveExactVersions: ShouldHaveExactVersions;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}
export declare function checkSatisfiesVersionsFromDependency(reportError: ReportError, pkg: ParsedPackageJson, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, depType: DependencyTypes, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.d.ts.map