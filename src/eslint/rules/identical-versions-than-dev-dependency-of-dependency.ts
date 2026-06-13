import { checkIdenticalVersionsThanDependency } from "../../checks/checkIdenticalVersionsThanDependency.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";
import { depGroupSchema } from "./identical-versions-than-dependency.ts";

type DestTypes = "dependencies" | "devDependencies" | "resolutions";
type DepRecord = Partial<Record<DestTypes, string[]>>;

interface Options extends BaseRuleOptions {
  dependencies: Record<string, DepRecord>;
}

export const identicalVersionsThanDevDependencyOfDependencyRule =
  createPackageRule<Options>(
    "identical-versions-than-dev-dependency-of-dependency",
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
                  depPkg.devDependencies,
                  onlyWarnsForCheck,
                );
              }
            });
          },
        );
      },
    },
  );
