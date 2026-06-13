import { checkSatisfiesVersionsInDependency } from "../../checks/checkSatisfiesVersionsInDependency.ts";
import type { DependenciesRanges } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface Options extends BaseRuleOptions {
  dependencies: Record<string, DependenciesRanges>;
}

const depTypeRangesSchema: object = {
  type: "object",
  patternProperties: {
    ".*": { type: ["string", "null"] },
  },
};

export const satisfiesVersionsInDependencyRule = createPackageRule<Options>(
  "satisfies-versions-in-dependency",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        patternProperties: {
          ".*": {
            type: "object",
            properties: {
              resolutions: depTypeRangesSchema,
              dependencies: depTypeRangesSchema,
              devDependencies: depTypeRangesSchema,
              peerDependencies: depTypeRangesSchema,
              optionalDependencies: depTypeRangesSchema,
            },
            additionalProperties: false,
          },
        },
      },
      onlyWarnsFor: { type: "array", items: { type: "string" } },
    },
    required: ["dependencies"],
    additionalProperties: false,
  },
  {
    checkPackage: ({ reportError, ruleOptions, getDependencyPackageJson }) => {
      Object.entries(ruleOptions.dependencies).forEach(([depName, ranges]) => {
        const [depPkg] = getDependencyPackageJson(depName);
        checkSatisfiesVersionsInDependency(reportError, depPkg, ranges);
      });
    },
  },
);
