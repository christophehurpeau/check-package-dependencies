import type { ShouldHaveExactVersions } from "../check-package.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
export interface CheckSatisfiesVersionsFromDependencyOptions {
    tryToAutoFix?: boolean;
    shouldHaveExactVersions: ShouldHaveExactVersions;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersionsBetweenDependencies(dep1PkgPath: string, dep1Pkg: PackageJson, dep1Type: DependencyTypes, depKeys: string[], dep2Pkg: PackageJson, dep2Type: DependencyTypes, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsBetweenDependencies.d.ts.map