import { checkDependencyMinRangeSatisfies } from "../../checks/checkMinRangeSatisfies.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const minRangeDependenciesSatisfiesDevDependenciesRule =
  createPackageRule(
    "min-range-dependencies-satisfies-dev-dependencies",
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "dependencies") {
          checkDependencyMinRangeSatisfies(
            reportError,
            node,
            pkg,
            "devDependencies",
          );
        }
      },
    },
  );
