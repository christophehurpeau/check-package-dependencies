import { checkDependencyMinRangeSatisfies } from "../../checks/checkMinRangeSatisfies.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
export const minRangePeerDependenciesSatisfiesDependenciesRule = createPackageRule("min-range-peer-dependencies-satisfies-dependencies", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "peerDependencies") {
            checkDependencyMinRangeSatisfies(reportError, node, pkg, "dependencies");
        }
    },
});
//# sourceMappingURL=min-range-peer-dependencies-satisfies-dependencies.js.map