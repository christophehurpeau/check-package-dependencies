import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.ts";
import {
  checkMissingSatisfiesVersions,
  isVersionSatisfiesRange,
} from "../../checks/checkSatisfiesVersions.ts";
import type { RegularDependencyTypes } from "../../utils/packageTypes.ts";
import type { BaseRuleOptions } from "../create-rule/BaseRuleOptions.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

interface CheckSatisfiesVersionsBetweenDependenciesOptions extends BaseRuleOptions {
  dependencies: {
    name: string;
    from: string | { name: string; in?: RegularDependencyTypes };
    to: string | { name: string; in?: RegularDependencyTypes };
  }[];
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
      checkPackage: ({
        pkg,
        reportError,
        ruleOptions,
        getDependencyPackageJson,
        onlyWarnsForCheck,
      }) => {
        ruleOptions.dependencies.forEach(({ from }) => {
          checkMissingSatisfiesVersions(
            reportError,
            pkg,
            regularDependencyTypes,
            {
              [typeof from === "string" ? from : from.name]: "*",
            },
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
        if (!(regularDependencyTypes as string[]).includes(node.fieldName)) {
          return;
        }

        ruleOptions.dependencies.forEach(({ name, from, to }) => {
          const [fromDepName, fromDepIn] =
            typeof from === "string"
              ? [from, "dependencies" as const]
              : [from.name, from.in ?? ("dependencies" as const)];

          if (fromDepName === node.name) {
            const [fromDepPkg] = getDependencyPackageJson(fromDepName);
            const fromDepRange = fromDepPkg[fromDepIn]?.[name];
            if (!fromDepRange) {
              throw new Error(
                `Dependency "${fromDepName}" has no dependency "${name}" in "${fromDepIn}".`,
              );
            }

            const [toDepName, toDepIn] =
              typeof to === "string"
                ? [to, "dependencies" as const]
                : [to.name, to.in ?? ("dependencies" as const)];

            const [toDepPkg] = getDependencyPackageJson(toDepName);
            const toDepRange = toDepPkg[toDepIn]?.[name];
            if (!toDepRange) {
              throw new Error(
                `Dependency "${toDepName}" has no dependency "${name}" in "${toDepIn}".`,
              );
            }

            if (!isVersionSatisfiesRange(fromDepRange, toDepRange)) {
              reportError({
                errorMessage:
                  "Version not satisfied between dependencies for dependency " +
                  `"${name}"`,
                errorDetails: `"${fromDepRange}" from "${fromDepName}" ${fromDepIn} should satisfies "${toDepRange}" from "${toDepName}" ${toDepIn}`,
                onlyWarns: onlyWarnsForCheck.shouldWarnsFor(node.name),
              });
            }
          }
        });
      },
    },
  );
