import type { ShouldHaveExactVersions } from "../check-package.ts";
import type { ReportError } from "../reporting/ReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckSatisfiesVersionsFromDependencyOptions {
    tryToAutoFix?: boolean;
    shouldHaveExactVersions: ShouldHaveExactVersions;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}
export declare function checkSatisfiesVersionsBetweenDependencies(reportError: ReportError, dep1Pkg: PackageJson, dep1Type: DependencyTypes, depKeys: string[], dep2Pkg: PackageJson, dep2Type: DependencyTypes, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsBetweenDependencies.d.ts.map