import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue, RegularDependencyTypes } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
/** the dependency a range is read from, and the field it is read in */
export type SatisfiesVersionsBetweenDependenciesSide = string | {
    name: string;
    in?: RegularDependencyTypes;
};
export interface SatisfiesVersionsBetweenDependenciesConfig extends Commented {
    /** the dependency whose range is compared in both packages */
    name: string;
    from: SatisfiesVersionsBetweenDependenciesSide;
    to: SatisfiesVersionsBetweenDependenciesSide;
}
export interface CheckSatisfiesVersionsBetweenDependenciesOptions {
    dependencies: SatisfiesVersionsBetweenDependenciesConfig[];
    getDependencyPackageJson: GetDependencyPackageJson;
    onlyWarnsForCheck?: OnlyWarnsForCheck;
}
export declare function checkSatisfiesVersionsBetweenDependencies(reportError: ReportError, dependencyValue: DependencyValue, { dependencies, getDependencyPackageJson, onlyWarnsForCheck, }: CheckSatisfiesVersionsBetweenDependenciesOptions): void;
//# sourceMappingURL=checkSatisfiesVersionsBetweenDependencies.d.ts.map