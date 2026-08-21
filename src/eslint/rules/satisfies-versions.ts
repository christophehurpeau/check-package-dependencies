import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import {
  checkMissingSatisfiesVersions,
  checkSatisfiesVersion,
} from "../../checks/checkSatisfiesVersions.ts";
import type { CommentedRange } from "../../utils/comments.ts";
import { commentSchema } from "../../utils/comments.ts";
import type { RegularDependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsOptions extends BaseRuleOptions {
  dependencies?: Record<string, CommentedRange>;
  devDependencies?: Record<string, CommentedRange>;
  optionalDependencies?: Record<string, CommentedRange>;
}

/** a range, or a range with the reason it is configured */
const commentedRangeSchema: object = {
  oneOf: [
    { type: "string" },
    {
      type: "object",
      properties: { range: { type: "string" }, comment: commentSchema },
      required: ["range"],
      additionalProperties: false,
    },
  ],
};

export const satisfiesVersionsRule =
  createPackageRule<CheckSatisfiesVersionsOptions>(
    "satisfies-versions",
    {
      type: "object",
      properties: {
        dependencies: {
          type: "object",
          additionalProperties: commentedRangeSchema,
        },
        devDependencies: {
          type: "object",
          additionalProperties: commentedRangeSchema,
        },
        optionalDependencies: {
          type: "object",
          additionalProperties: commentedRangeSchema,
        },
        onlyWarnsFor: onlyWarnsForArraySchema,
      },
      additionalProperties: false,
    },
    {
      docs: {
        description:
          "Require configured dependencies to be present and to satisfy the configured ranges",
        recommended: false,
      },
      hasSuggestions: true,
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
          const rangeConfig = ruleOptions[fieldName][node.name];
          if (!rangeConfig) {
            throw new Error(
              `Range is undefined for ${node.name} in ${node.fieldName}`,
            );
          }
          checkSatisfiesVersion(
            reportError,
            node,
            rangeConfig,
            onlyWarnsForCheck,
          );
        }
      },
    },
  );
