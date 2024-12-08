import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
export type CheckResolutionMessage = (depKey: string, resolutionExplainedMessage: string, checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
}) => string | undefined;
export declare function checkResolutionsHasExplanation(pkg: ParsedPackageJson, checkMessage: CheckResolutionMessage, getDependencyPackageJson: GetDependencyPackageJson, customCreateReportError?: typeof createReportError): void;
//# sourceMappingURL=checkResolutionsHasExplanation.d.ts.map