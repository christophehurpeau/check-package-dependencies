import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils";
export interface CheckSatisfiesVersionsOptions {
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersions(pkg: PackageJson, pkgPathName: string, type: DependencyTypes, dependenciesRanges: Record<string, string>, onlyWarnsForCheck?: OnlyWarnsForCheck, { customCreateReportError, }?: CheckSatisfiesVersionsOptions): void;
//# sourceMappingURL=checkSatisfiesVersions.d.ts.map