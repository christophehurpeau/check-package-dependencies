import { checkDirectPeerDependencies } from "../../checks/checkDirectPeerDependencies.ts";
import type { OnlyWarnsFor } from "../../utils/warnForUtils.ts";
import { createOnlyWarnsForMappingCheck } from "../../utils/warnForUtils.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import {
  createPackageRule,
  onlyWarnsForMappingSchema,
} from "../create-rule/createPackageRule.ts";

interface CheckDirectPeerDependenciesOptions extends BaseRuleOptions {
  onlyWarnsForMissing?: OnlyWarnsFor;
  /**
   * Peer dependency names allowed to be satisfied from devDependencies even for
   * libraries, in addition to the built-in "@types/*" and "*\/types" packages.
   */
  allowedPeerInDevDependencies?: string[];
}

export const requireDirectPeerDependenciesRule =
  createPackageRule<CheckDirectPeerDependenciesOptions>(
    "require-direct-peer-dependencies",
    {
      type: "object",
      properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
        onlyWarnsForMissing: onlyWarnsForMappingSchema,
        allowedPeerInDevDependencies: {
          type: "array",
          items: { type: "string" },
        },
      },
      additionalProperties: false,
    },
    {
      docs: {
        description:
          "Require peer dependencies of direct dependencies to be present and satisfied",
        recommended: true,
      },
      checkPackage: ({
        pkg,
        reportError,
        settings,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForMappingCheck: invalidOnlyWarnsForCheck,
        checkOnlyWarnsForMapping,
      }) => {
        const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
          "onlyWarnsForMissing",
          ruleOptions.onlyWarnsForMissing,
        );

        checkDirectPeerDependencies(
          reportError,
          settings.isLibrary ?? false,
          pkg,
          getDependencyPackageJson,
          missingOnlyWarnsForCheck,
          invalidOnlyWarnsForCheck,
          ruleOptions.allowedPeerInDevDependencies,
        );

        checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
      },
    },
  );
