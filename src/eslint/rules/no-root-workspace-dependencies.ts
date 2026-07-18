import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const noRootWorkspaceDependenciesRule = createPackageRule(
  "no-root-workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (!pkg.workspacesPackages) {
        return;
      }

      if (node.fieldName === "dependencies") {
        reportError({
          errorMessage: "Root workspace should not have dependencies",
          dependency: node,
        });
      }
    },
  },
);
