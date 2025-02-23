import { checkResolutionVersionMatch } from "../../checks/checkResolutionsVersionsMatch.ts";
import type { CheckExactVersionsOptions } from "../../index.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

export const resolutionsVersionsMatchRule =
  createPackageRule<CheckExactVersionsOptions>(
    "resolutions-versions-match",
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({ node, pkg, reportError }) => {
        if (node.fieldName === "resolutions") {
          checkResolutionVersionMatch(reportError, pkg, node);
        }
      },
    },
  );
