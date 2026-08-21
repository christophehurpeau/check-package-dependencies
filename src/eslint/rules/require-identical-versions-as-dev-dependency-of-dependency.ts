import { checkIdenticalVersionsThanDependency } from "../../checks/checkIdenticalVersionsThanDependency.ts";
import type { Commented } from "../../utils/comments.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";
import { depGroupSchema } from "./require-identical-versions-as-dependency.ts";

type DestTypes = "dependencies" | "devDependencies" | "resolutions";
type DepRecord = Commented & Partial<Record<DestTypes, string[]>>;

interface Options extends BaseRuleOptions {
  dependencies: Record<string, DepRecord>;
}

export const requireIdenticalVersionsAsDevDependencyOfDependencyRule =
  createPackageRule<Options>(
    "require-identical-versions-as-dev-dependency-of-dependency",
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
          "Require configured dependencies to have the same version as the one in the `devDependencies` of another dependency",
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
                  depPkg.devDependencies,
                  { onlyWarnsForCheck, comment: targets.comment },
                );
              }
            });
          },
        );
      },
    },
  );
