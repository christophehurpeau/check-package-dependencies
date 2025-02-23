import { checkResolutionExplanation, checkResolutionHasExplanation, } from "../../checks/checkResolutionsHasExplanation.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
export const resolutionsHasExplanationRule = createPackageRule("resolutions-has-explanation", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, reportError, pkg }) => {
        if (node.fieldName === "resolutions") {
            checkResolutionHasExplanation(reportError, node, pkg);
        }
        else if (node.fieldName === "resolutionsExplained") {
            checkResolutionExplanation(reportError, node, pkg);
        }
    },
});
//# sourceMappingURL=resolutions-has-explanation.js.map