import { checkResolutionVersionMatch } from "../../checks/checkResolutionsVersionsMatch.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const resolutionsVersionsMatchRule = createPackageRule<BaseRuleOptions>(
  "resolutions-versions-match",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    docs: {
      description:
        "Require `resolutions` versions to match the versions in `dependencies` and `devDependencies`",
      recommended: true,
    },
    hasSuggestions: true,
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (node.fieldName === "resolutions") {
        checkResolutionVersionMatch(reportError, pkg, node);
      }
    },
  },
);
