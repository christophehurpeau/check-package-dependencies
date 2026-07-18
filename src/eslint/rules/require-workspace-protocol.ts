import type { DependencyTypes } from "../../utils/packageTypes.ts";
import { createPackageRule } from "../create-rule/createPackageRule.ts";

const WORKSPACE_PROTOCOL_PREFIX = "workspace:";

const DEP_TYPES_TO_CHECK: DependencyTypes[] = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const getWorkspaceProtocolFixTo = (value: string): string => {
  if (value.startsWith("^")) return "workspace:^";
  if (value.startsWith("~")) return "workspace:~";
  return "workspace:*";
};

export const requireWorkspaceProtocolRule = createPackageRule(
  "require-workspace-protocol",
  {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  {
    checkDependencyValue: ({ node, reportError, getWorkspaceMemberNames }) => {
      if (!DEP_TYPES_TO_CHECK.includes(node.fieldName)) {
        return;
      }

      const workspaceMemberNames = getWorkspaceMemberNames();
      if (
        workspaceMemberNames?.has(node.name) &&
        !node.value.startsWith(WORKSPACE_PROTOCOL_PREFIX)
      ) {
        reportError({
          errorMessage: `Dependency "${node.name}" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "${node.value}"`,
          dependency: node,
          errorTarget: "dependencyValue",
          fixTo: getWorkspaceProtocolFixTo(node.value),
        });
      }
    },
  },
);
