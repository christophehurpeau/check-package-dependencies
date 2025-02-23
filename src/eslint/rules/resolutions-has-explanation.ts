import {
  checkResolutionExplanation,
  checkResolutionHasExplanation,
} from "../../checks/checkResolutionsHasExplanation.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

type ResolutionsHasExplanationOptions = BaseRuleOptions;

export const resolutionsHasExplanationRule =
  createPackageRule<ResolutionsHasExplanationOptions>(
    "resolutions-has-explanation",
    {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({ node, reportError, pkg }) => {
        if (node.fieldName === "resolutions") {
          checkResolutionHasExplanation(reportError, node, pkg);
        } else if (node.fieldName === "resolutionsExplained") {
          checkResolutionExplanation(reportError, node, pkg);
        }
      },
    },
  );
