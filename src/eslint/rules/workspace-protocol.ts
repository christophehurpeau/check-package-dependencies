import type { DependencyTypes } from "../../utils/packageTypes.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

const WORKSPACE_PROTOCOL_PREFIX = "workspace:";

const DEP_TYPES_TO_CHECK: DependencyTypes[] = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export const workspaceProtocolRule = createPackageRule(
  "workspace-protocol",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    checkPackage: ({ pkg, reportError, loadWorkspacePackageJsons }) => {
      if (!pkg.value.workspaces) {
        return;
      }

      const workspacePackageJsons = loadWorkspacePackageJsons();
      const workspacePackageNames = new Set(
        workspacePackageJsons.map((p) => p.name),
      );

      for (const subPkg of workspacePackageJsons) {
        for (const depType of DEP_TYPES_TO_CHECK) {
          const deps = subPkg[depType];
          if (!deps) continue;

          for (const depValue of Object.values(deps)) {
            if (
              depValue &&
              workspacePackageNames.has(depValue.name) &&
              !depValue.value.startsWith(WORKSPACE_PROTOCOL_PREFIX)
            ) {
              reportError({
                errorMessage: `${subPkg.name}: Dependency "${depValue.name}" in "${depType}" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "${depValue.value}"`,
              });
            }
          }
        }
      }
    },
  },
);
