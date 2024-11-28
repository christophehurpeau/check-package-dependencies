import { createReportError } from "../utils/createReportError.ts";
import type { DependenciesRanges, PackageJson } from "../utils/packageTypes.ts";
interface CheckSatisfiesVersionsInDependencyOptions {
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersionsInDependency(pkgPathName: string, depPkg: PackageJson, dependenciesRanges: DependenciesRanges, { customCreateReportError, }?: CheckSatisfiesVersionsInDependencyOptions): void;
export {};
//# sourceMappingURL=checkSatisfiesVersionsInDependency.d.ts.map