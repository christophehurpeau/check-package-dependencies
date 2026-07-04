import type { ParsedPackageJson } from "./packageTypes.ts";
/**
 * Finds the nearest ancestor package.json declaring workspaces, starting from `startDirname`,
 * and returns the `name` of every workspace member package. Lets a rule check a workspace
 * member's own file for cross-workspace-package issues without needing to be run against the
 * root package.json.
 */
export declare const findWorkspaceMemberNames: (startDirname: string) => Set<string> | undefined;
/**
 * Finds and parses the nearest ancestor package.json declaring workspaces, starting from
 * `startDirname`. Lets a rule running against a workspace member's own file look up the
 * monorepo root's package.json (e.g. its devDependencies) without needing to be run against
 * the root package.json itself.
 */
export declare const findWorkspaceRootPackageJson: (startDirname: string) => ParsedPackageJson | undefined;
//# sourceMappingURL=workspaceMembers.d.ts.map