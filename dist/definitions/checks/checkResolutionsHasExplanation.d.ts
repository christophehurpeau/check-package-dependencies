import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
export declare function checkResolutionHasExplanation(reportError: ReportError, dependencyValue: DependencyValue, pkg: ParsedPackageJson): void;
export declare function checkResolutionExplanation(reportError: ReportError, dependencyValue: DependencyValue, pkg: ParsedPackageJson): void;
export type CheckResolutionMessage = (depKey: string, resolutionExplainedMessage: string, checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
}) => string | undefined;
export declare function checkResolutionsHasExplanation(reportError: ReportError, pkg: ParsedPackageJson, checkMessage: CheckResolutionMessage, getDependencyPackageJson: GetDependencyPackageJson): void;
//# sourceMappingURL=checkResolutionsHasExplanation.d.ts.map