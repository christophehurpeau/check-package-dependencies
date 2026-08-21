import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue, ParsedPackageJson, RegularDependencyTypes } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
/**
 * Which dependencies of the package are expected to satisfy the range declared by
 * another dependency, keyed by the name of that other dependency.
 */
export type SatisfiesVersionsFromDependencyConfig = Record<string, Commented & Partial<Record<RegularDependencyTypes, string[]>>>;
export interface CheckSatisfiesVersionsFromDependencyOptions {
    dependencies: SatisfiesVersionsFromDependencyConfig;
    /** the field of the other dependency's package.json the expected ranges are read from */
    readRangesFrom: "dependencies" | "devDependencies";
    getDependencyPackageJson: GetDependencyPackageJson;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}
export declare function checkMissingSatisfiesVersionsFromDependency(reportError: ReportError, pkg: ParsedPackageJson, { dependencies, readRangesFrom, getDependencyPackageJson, onlyWarnsForCheck, }: CheckSatisfiesVersionsFromDependencyOptions): void;
export declare function checkDependencySatisfiesVersionFromDependency(reportError: ReportError, dependencyValue: DependencyValue, { dependencies, readRangesFrom, getDependencyPackageJson, onlyWarnsForCheck, }: CheckSatisfiesVersionsFromDependencyOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.d.ts.map