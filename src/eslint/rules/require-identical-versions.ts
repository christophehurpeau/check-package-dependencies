import type { IdenticalVersionsDepConfig } from "../../checks/checkIdenticalVersions.ts";
import { checkIdenticalVersions } from "../../checks/checkIdenticalVersions.ts";
import { commentSchema } from "../../utils/comments.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";

type SourceType = "dependencies" | "devDependencies" | "resolutions";

const depRecordSchema: object = {
  type: "object",
  patternProperties: {
    ".*": {
      oneOf: [
        { type: "array", items: { type: "string" } },
        {
          type: "object",
          properties: {
            resolutions: { type: "array", items: { type: "string" } },
            dependencies: { type: "array", items: { type: "string" } },
            devDependencies: { type: "array", items: { type: "string" } },
            comment: commentSchema,
          },
          additionalProperties: false,
        },
      ],
    },
  },
} satisfies object;

interface Options extends BaseRuleOptions {
  resolutions?: Record<string, IdenticalVersionsDepConfig>;
  dependencies?: Record<string, IdenticalVersionsDepConfig>;
  devDependencies?: Record<string, IdenticalVersionsDepConfig>;
}

const sourceTypes: SourceType[] = [
  "resolutions",
  "dependencies",
  "devDependencies",
];

export const requireIdenticalVersionsRule = createPackageRule<Options>(
  "require-identical-versions",
  {
    type: "object",
    properties: {
      resolutions: depRecordSchema,
      dependencies: depRecordSchema,
      devDependencies: depRecordSchema,
      onlyWarnsFor: onlyWarnsForArraySchema,
    },
    additionalProperties: false,
  },
  {
    docs: {
      description:
        "Require configured dependencies to have the same version as another dependency of the same package.json",
      recommended: false,
    },
    checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
      sourceTypes.forEach((type) => {
        const deps = ruleOptions[type];
        if (deps) {
          checkIdenticalVersions(reportError, pkg, type, deps, {
            onlyWarnsForCheck,
          });
        }
      });
    },
  },
);
