import { checkExactVersion } from "../../checks/checkExactVersions.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";

interface CheckExactVersionsOptions extends BaseRuleOptions {
  dependencies?: boolean;
  devDependencies?: boolean;
  resolutions?: boolean;
}

export const exactVersionsRule = createPackageRule<CheckExactVersionsOptions>(
  "exact-versions",
  {
    type: "object",
    properties: {
      dependencies: { type: "boolean", default: true },
      devDependencies: { type: "boolean", default: true },
      resolutions: { type: "boolean", default: true },
      onlyWarnsFor: onlyWarnsForArraySchema,
    },
    additionalProperties: false,
  },
  {
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck,
    }) => {
      if (
        [
          ruleOptions.dependencies && "dependencies",
          ruleOptions.devDependencies && "devDependencies",
          ruleOptions.resolutions && "resolutions",
        ]
          .filter(Boolean)
          .includes(node.fieldName)
      ) {
        checkExactVersion(reportError, node, {
          getDependencyPackageJson,
          onlyWarnsForCheck,
        });
      }
    },
  },
);
