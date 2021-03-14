import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import type { PackageJson } from '../utils/packageTypes';
export declare type CheckResolutionMessage = (depKey: string, resolutionExplainedMessage: string, checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
}) => string | undefined;
export declare function checkResolutionsHasExplanation(pkg: PackageJson, pkgPathName: string, checkMessage: CheckResolutionMessage, getDependencyPackageJson: GetDependencyPackageJson): void;
//# sourceMappingURL=checkResolutionsHasExplanation.d.ts.map