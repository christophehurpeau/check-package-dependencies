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
export declare function checkSatisfiesVersionsFromDependency(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, depKeys: string[], depPkg: PackageJson, depType: DependencyTypes, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.d.ts.map