import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
export type CheckResolutionMessage = (depKey: string, resolutionExplainedMessage: string, checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
}) => string | undefined;
export declare function checkResolutionsHasExplanation(reportError: ReportError, pkg: ParsedPackageJson, checkMessage: CheckResolutionMessage, getDependencyPackageJson: GetDependencyPackageJson): void;
//# sourceMappingURL=checkResolutionsHasExplanation.d.ts.map