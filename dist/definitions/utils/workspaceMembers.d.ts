/**
 * Finds the nearest ancestor package.json declaring workspaces (a `workspaces` field or a
 * sibling pnpm-workspace.yaml), starting from `startDirname`, and returns the `name` of
 * every workspace member package. Lets a rule check a workspace member's own file for
 * cross-workspace-package issues without needing to be run against the root package.json.
 */
export declare const findWorkspaceMemberNames: (startDirname: string) => Set<string> | undefined;
//# sourceMappingURL=workspaceMembers.d.ts.map