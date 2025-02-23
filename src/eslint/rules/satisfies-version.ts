import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import {
  checkMissingSatisfiesVersions,
  checkSatisfiesVersion,
} from "../../checks/checkSatisfiesVersions.ts";
import type { RegularDependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsOptions extends BaseRuleOptions {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export const satisfiesVersionsRule =
  createPackageRule<CheckSatisfiesVersionsOptions>(
    "satisfies-versions",
    {
      type: "object",
      properties: {
        dependencies: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        devDependencies: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        optionalDependencies: {
          type: "object",
          additionalProperties: { type: "string" },
        },
        onlyWarnsFor: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
    {
      checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
        if (!ruleOptions.dependencies && !ruleOptions.devDependencies) {
          throw new Error(
            'Rule "check-package-dependencies/satisfies-versions" is enabled but no dependencies are configured to check',
          );
        }

        regularDependencyTypes.forEach((type) => {
          if (ruleOptions[type]) {
            checkMissingSatisfiesVersions(
              reportError,
              pkg,
              type,
              ruleOptions[type],
              onlyWarnsForCheck,
            );
          }
        });
      },
      checkDependencyValue: ({
        node,
        reportError,
        ruleOptions,
        onlyWarnsForCheck,
      }) => {
        if (!(regularDependencyTypes as string[]).includes(node.fieldName)) {
          return;
        }
        const fieldName = node.fieldName as RegularDependencyTypes;
        if (ruleOptions[fieldName]?.[node.name]) {
          const range = ruleOptions[fieldName][node.name];
          if (!range) {
            throw new Error(
              `Range is undefined for ${node.name} in ${node.fieldName}`,
            );
          }
          checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
        }
      },
    },
  );
