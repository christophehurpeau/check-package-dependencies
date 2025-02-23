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
}

export const directPeerDependenciesRule =
  createPackageRule<CheckDirectPeerDependenciesOptions>(
    "direct-peer-dependencies",
    {
      type: "object",
      properties: {
        onlyWarnsFor: onlyWarnsForMappingSchema,
        onlyWarnsForMissing: onlyWarnsForMappingSchema,
      },
      additionalProperties: false,
    },
    {
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
        );

        checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
      },
    },
  );
