import { checkIdenticalVersions } from "../../checks/checkIdenticalVersions.ts";
import type { DependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

type SourceType = "dependencies" | "devDependencies" | "resolutions";
type DepConfig = Partial<Record<DependencyTypes, string[]>> | string[];

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
          },
          additionalProperties: false,
        },
      ],
    },
  },
} satisfies object;

interface Options extends BaseRuleOptions {
  resolutions?: Record<string, DepConfig>;
  dependencies?: Record<string, DepConfig>;
  devDependencies?: Record<string, DepConfig>;
}

const sourceTypes: SourceType[] = [
  "resolutions",
  "dependencies",
  "devDependencies",
];

export const identicalVersionsRule = createPackageRule<Options>(
  "identical-versions",
  {
    type: "object",
    properties: {
      resolutions: depRecordSchema,
      dependencies: depRecordSchema,
      devDependencies: depRecordSchema,
      onlyWarnsFor: { type: "array", items: { type: "string" } },
    },
    additionalProperties: false,
  },
  {
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
