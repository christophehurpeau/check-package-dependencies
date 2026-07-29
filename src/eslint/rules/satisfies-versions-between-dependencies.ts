import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import { checkMissingSatisfiesVersions } from "../../checks/checkSatisfiesVersions.ts";
import type { SatisfiesVersionsBetweenDependenciesConfig } from "../../checks/checkSatisfiesVersionsBetweenDependencies.ts";
import { checkSatisfiesVersionsBetweenDependencies } from "../../checks/checkSatisfiesVersionsBetweenDependencies.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsBetweenDependenciesOptions extends BaseRuleOptions {
  dependencies: SatisfiesVersionsBetweenDependenciesConfig[];
}

export const satisfiesVersionsBetweenDependenciesRule =
  createPackageRule<CheckSatisfiesVersionsBetweenDependenciesOptions>(
    "satisfies-versions-between-dependencies",
    {
      type: "object",
      properties: {
        dependencies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              from: {
                oneOf: [
                  { type: "string" },
                  {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      in: { type: "string" },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                ],
              },
              to: {
                oneOf: [
                  { type: "string" },
                  {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      in: { type: "string" },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                ],
              },
            },
            required: ["name", "from", "to"],
            additionalProperties: false,
          },
          additionalProperties: false,
        },
        required: ["dependencies"],
      },
      additionalProperties: false,
    },
    {
      docs: {
        description:
          "Require the range of a dependency in one dependency to satisfy the range of the same dependency in another dependency",
        recommended: false,
      },
      checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
        ruleOptions.dependencies.forEach(({ from }) => {
          checkMissingSatisfiesVersions(
            reportError,
            pkg,
            regularDependencyTypes,
            { [typeof from === "string" ? from : from.name]: "*" },
            onlyWarnsForCheck,
          );
        });
      },

      checkDependencyValue: ({
        node,
        reportError,
        ruleOptions,
        onlyWarnsForCheck,
        getDependencyPackageJson,
      }) => {
        checkSatisfiesVersionsBetweenDependencies(reportError, node, {
          dependencies: ruleOptions.dependencies,
          getDependencyPackageJson,
          onlyWarnsForCheck,
        });
      },
    },
  );
