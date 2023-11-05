import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import { createReportError } from '../utils/createReportError';
import type { PackageJson } from '../utils/packageTypes';
export type CheckResolutionMessage = (depKey: string, resolutionExplainedMessage: string, checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
}) => string | undefined;
export declare function checkResolutionsHasExplanation(pkg: PackageJson, pkgPathName: string, checkMessage: CheckResolutionMessage, getDependencyPackageJson: GetDependencyPackageJson, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkResolutionsHasExplanation.d.ts.map