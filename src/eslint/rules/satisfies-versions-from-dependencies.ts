import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import {
  checkMissingSatisfiesVersions,
  checkSatisfiesVersion,
} from "../../checks/checkSatisfiesVersions.ts";
import { getEntries } from "../../utils/object.ts";
import type { RegularDependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsFromDependenciesOptions extends BaseRuleOptions {
  dependencies: Record<
    string,
    Partial<Record<RegularDependencyTypes, string[]>>
  >;
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
      checkPackage: ({
        pkg,
        reportError,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForCheck,
      }) => {
        if (!ruleOptions.dependencies) {
          throw new Error(
            'Rule "check-package-dependencies/satisfies-versions-from-dependencies" is enabled but no dependencies are configured to check',
          );
        }

        Object.entries(ruleOptions.dependencies).forEach(
          ([depName, values]) => {
            const [depPkg] = getDependencyPackageJson(depName);

            regularDependencyTypes.forEach((type) => {
              if (values[type]) {
                const dependenciesRanges = Object.fromEntries(
                  values[type].map((v) => {
                    const range = depPkg.dependencies?.[v];
                    if (!range) {
                      throw new Error(
                        `Dependency ${depName} has no dependency ${v} in ${type}`,
                      );
                    }
                    return [v, range];
                  }),
                );

                checkMissingSatisfiesVersions(
                  reportError,
                  pkg,
                  type,
                  dependenciesRanges,
                  onlyWarnsForCheck,
                );
              }
            });
          },
        );
      },
      checkDependencyValue: ({
        node,
        reportError,
        ruleOptions,
        onlyWarnsForCheck,
        getDependencyPackageJson,
      }) => {
        if (!(regularDependencyTypes as string[]).includes(node.fieldName)) {
          return;
        }
        const fieldName = node.fieldName as RegularDependencyTypes;

        getEntries(ruleOptions.dependencies).forEach(([depName, values]) => {
          if (values[fieldName]?.includes(node.name)) {
            const [depPkg] = getDependencyPackageJson(depName);
            const range = depPkg.dependencies?.[node.name];
            if (!range) {
              throw new Error(
                `Dependency "${depName}" has no dependency "${fieldName}"`,
              );
            }
            checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
          }
        });
      },
    },
  );
