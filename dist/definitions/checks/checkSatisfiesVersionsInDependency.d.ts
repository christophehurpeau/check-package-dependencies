import { createReportError } from "../utils/createReportError";
import type { DependenciesRanges, PackageJson } from "../utils/packageTypes";
interface CheckSatisfiesVersionsInDependencyOptions {
    customCreateReportError?: typeof createReportError;
}
export declare function checkSatisfiesVersionsInDependency(pkgPathName: string, depPkg: PackageJson, dependenciesRanges: DependenciesRanges, { customCreateReportError, }?: CheckSatisfiesVersionsInDependencyOptions): void;
export {};
//# sourceMappingURL=checkSatisfiesVersionsInDependency.d.ts.map