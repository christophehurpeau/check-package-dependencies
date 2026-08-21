import { checkIdenticalVersionsThanDependency } from "../../checks/checkIdenticalVersionsThanDependency.ts";
import type { Commented } from "../../utils/comments.ts";
import { commentSchema } from "../../utils/comments.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";

type DestTypes = "dependencies" | "devDependencies" | "resolutions";
type DepRecord = Commented & Partial<Record<DestTypes, string[]>>;

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
        comment: commentSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export { depGroupSchema };

export const requireIdenticalVersionsAsDependencyRule =
  createPackageRule<Options>(
    "require-identical-versions-as-dependency",
    {
      type: "object",
      properties: {
        dependencies: depGroupSchema,
        onlyWarnsFor: onlyWarnsForArraySchema,
      },
      required: ["dependencies"],
      additionalProperties: false,
    },
    {
      docs: {
        description:
          "Require configured dependencies to have the same version as the one in the `dependencies` of another dependency",
        recommended: false,
      },
      checkPackage: ({
        pkg,
        reportError,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForCheck,
      }) => {
        Object.entries(ruleOptions.dependencies).forEach(
          ([depName, targets]) => {
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
                  { onlyWarnsForCheck, comment: targets.comment },
                );
              }
            });
          },
        );
      },
    },
  );
