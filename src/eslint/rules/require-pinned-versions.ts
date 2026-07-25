import { checkExactVersion } from "../../checks/checkExactVersions.ts";
import type { DependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForArraySchema,
} from "../create-rule/createPackageRule.ts";

const pinnedDependencyTypes: DependencyTypes[] = [
  "dependencies",
  "devDependencies",
  "resolutions",
];

export const requirePinnedVersionsRule = createPackageRule<BaseRuleOptions>(
  "require-pinned-versions",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForArraySchema,
    },
    additionalProperties: false,
  },
  {
    docs: {
      description:
        "Require pinned versions in `dependencies`, `devDependencies` and `resolutions`",
      recommended: true,
    },
    fixable: true,
    checkDependencyValue: ({
      node,
      reportError,
      isLibrary,
      getDependencyPackageJson,
      onlyWarnsForCheck,
    }) => {
      if (!pinnedDependencyTypes.includes(node.fieldName)) return;
      // a library declares ranges in "dependencies" so that its consumers can
      // deduplicate them
      if (isLibrary && node.fieldName === "dependencies") return;

      checkExactVersion(reportError, node, {
        getDependencyPackageJson,
        onlyWarnsForCheck,
      });
    },
  },
);
