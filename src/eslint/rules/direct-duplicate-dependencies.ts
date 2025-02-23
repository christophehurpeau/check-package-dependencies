import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.ts";
import type {
  DependencyFieldTypes,
  DependencyTypes,
} from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForMappingSchema,
} from "../create-rule/createPackageRule.ts";

type CheckDirectPeerDependenciesOptions = BaseRuleOptions;

export const directDuplicateDependenciesRule =
  createPackageRule<CheckDirectPeerDependenciesOptions>(
    "direct-duplicate-dependencies",
    {
      type: "object",
      properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
      },
      additionalProperties: false,
    },
    {
      checkDependencyValue: ({
        node,
        pkg,
        reportError,
        settings,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForMappingCheck,
      }) => {
        const searchInByDependencyType: Partial<
          Record<DependencyFieldTypes, DependencyTypes[]>
        > = {
          devDependencies: ["devDependencies", "dependencies"],
          dependencies: ["devDependencies", "dependencies"],
        };

        if (node.fieldName === "resolutionsExplained") {
          return;
        }

        const searchIn = searchInByDependencyType[node.fieldName];
        if (!searchIn) {
          return;
        }

        const [depPkg] = getDependencyPackageJson(node.name);
        checkDuplicateDependencies(
          reportError,
          pkg,
          settings.isLibrary ?? false,
          "dependencies",
          searchIn,
          depPkg,
          onlyWarnsForMappingCheck.createFor(node.name),
        );
      },
    },
  );
