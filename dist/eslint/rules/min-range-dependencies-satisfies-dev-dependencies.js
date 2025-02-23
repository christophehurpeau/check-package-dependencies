import { checkDependencyMinRangeSatisfies } from "../../checks/checkMinRangeSatisfies.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
export const minRangeDependenciesSatisfiesDevDependenciesRule = createPackageRule("min-range-dependencies-satisfies-dev-dependencies", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "dependencies") {
            checkDependencyMinRangeSatisfies(reportError, node, pkg, "devDependencies");
        }
    },
});
//# sourceMappingURL=min-range-dependencies-satisfies-dev-dependencies.js.map