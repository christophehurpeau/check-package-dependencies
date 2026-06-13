import { checkIdenticalVersionsThanDependency } from "../../checks/checkIdenticalVersionsThanDependency.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

type DestTypes = "dependencies" | "devDependencies" | "resolutions";
type DepRecord = Partial<Record<DestTypes, string[]>>;

interface Options extends BaseRuleOptions {
  dependencies: Record<string, DepRecord>;
}

const depGroupSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      type: "object",
      properties: {
        resolutions: { type: "array", items: { type: "string" } },
        dependencies: { type: "array", items: { type: "string" } },
        devDependencies: { type: "array", items: { type: "string" } },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export { depGroupSchema };

export const identicalVersionsThanDependencyRule = createPackageRule<Options>(
  "identical-versions-than-dependency",
  {
    type: "object",
    properties: {
      dependencies: depGroupSchema,
      onlyWarnsFor: { type: "array", items: { type: "string" } },
    },
    required: ["dependencies"],
    additionalProperties: false,
  },
  {
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck,
    }) => {
      Object.entries(ruleOptions.dependencies).forEach(([depName, targets]) => {
        const [depPkg] = getDependencyPackageJson(depName);

        const destTypes: DestTypes[] = [
          "resolutions",
          "dependencies",
          "devDependencies",
        ];
        destTypes.forEach((destType) => {
          const depKeys = targets[destType];
          if (depKeys && depKeys.length > 0) {
            checkIdenticalVersionsThanDependency(
              reportError,
              pkg,
              destType,
              depKeys,
              depPkg,
              depPkg.dependencies,
              onlyWarnsForCheck,
            );
          }
        });
      });
    },
  },
);
