import type { SatisfiesVersionsFromDependencyConfig } from "../../checks/checkSatisfiesVersionsFromDependency.ts";
import {
  checkDependencySatisfiesVersionFromDependency,
  checkMissingSatisfiesVersionsFromDependency,
} from "../../checks/checkSatisfiesVersionsFromDependency.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsFromDependenciesOptions extends BaseRuleOptions {
  dependencies: SatisfiesVersionsFromDependencyConfig;
}

export const satisfiesVersionsFromDependenciesRule =
  createPackageRule<CheckSatisfiesVersionsFromDependenciesOptions>(
    "satisfies-versions-from-dependencies",
    {
      type: "object",
      properties: {
        dependencies: {
          type: "object",
          patternProperties: {
            ".*": {
              type: "object",
              properties: {
                dependencies: {
                  type: "array",
                  items: { type: "string" },
                  optional: true,
                },
                devDependencies: {
                  type: "array",
                  items: { type: "string" },
                  optional: true,
                },
                optionalDependencies: {
                  type: "array",
                  items: { type: "string" },
                  optional: true,
                },
              },
              additionalProperties: false,
            },
          },
          additionalProperties: false,
        },
      },
      required: ["dependencies"],
      additionalProperties: false,
    },
    {
      docs: {
        description:
          "Require configured dependencies to satisfy the ranges declared in the `dependencies` of another dependency",
        recommended: false,
      },
      hasSuggestions: true,
      checkPackage: ({
        pkg,
        reportError,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForCheck,
      }) => {
        checkMissingSatisfiesVersionsFromDependency(reportError, pkg, {
          dependencies: ruleOptions.dependencies,
          readRangesFrom: "dependencies",
          getDependencyPackageJson,
          onlyWarnsForCheck,
        });
      },
      checkDependencyValue: ({
        node,
        reportError,
        ruleOptions,
        onlyWarnsForCheck,
        getDependencyPackageJson,
      }) => {
        checkDependencySatisfiesVersionFromDependency(reportError, node, {
          dependencies: ruleOptions.dependencies,
          readRangesFrom: "dependencies",
          getDependencyPackageJson,
          onlyWarnsForCheck,
        });
      },
    },
  );
