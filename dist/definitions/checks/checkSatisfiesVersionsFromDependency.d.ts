import type { ShouldHaveExactVersions } from "../check-package";
import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";
export interface CheckSatisfiesVersionsFromDependencyOptions {
    tryToAutoFix?: boolean;
    shouldHaveExactVersions: ShouldHaveExactVersions;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersionsFromDependency(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, depType: DependencyTypes, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.d.ts.map