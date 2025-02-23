import { checkResolutionVersionMatch } from "../../checks/checkResolutionsVersionsMatch.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
export const resolutionsVersionsMatchRule = createPackageRule("resolutions-versions-match", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "resolutions") {
            checkResolutionVersionMatch(reportError, pkg, node);
        }
    },
});
//# sourceMappingURL=resolutions-versions-match.js.map