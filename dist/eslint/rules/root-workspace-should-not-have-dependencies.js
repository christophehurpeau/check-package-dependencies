import { createPackageRule } from "../create-rule/createPackageRule.js";
export const rootWorkspaceShouldNotHaveDependenciesRule = createPackageRule("root-workspace-should-not-have-dependencies", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkDependencyValue: ({ node, pkg, reportError }) => {
        if (!pkg.value.workspaces) {
            return;
        }
        if (node.fieldName === "dependencies") {
            reportError({
                errorMessage: "Root workspace should not have dependencies",
                dependency: node,
            });
        }
    },
});
//# sourceMappingURL=root-workspace-should-not-have-dependencies.js.map