import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const noRootWorkspaceDependenciesRule = createPackageRule(
  "no-root-workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    docs: {
      description:
        "Disallow `dependencies` in the root package.json of a workspace",
      recommended: true,
    },
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
