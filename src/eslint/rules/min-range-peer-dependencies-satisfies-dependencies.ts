import { checkDependencyMinRangeSatisfies } from "../../checks/checkMinRangeSatisfies.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const minRangePeerDependenciesSatisfiesDependenciesRule =
  createPackageRule(
    "min-range-peer-dependencies-satisfies-dependencies",
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "peerDependencies") {
          checkDependencyMinRangeSatisfies(
            reportError,
            node,
            pkg,
            "dependencies",
          );
        }
      },
    },
  );
