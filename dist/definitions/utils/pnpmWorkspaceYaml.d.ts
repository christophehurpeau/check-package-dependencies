import type { PackageJson } from "./packageTypes.ts";
/** Minimal parser for the `packages:` list in pnpm-workspace.yaml, avoiding a full YAML dependency. */
export declare const parsePnpmWorkspacePackages: (content: string) => string[];
/**
 * Resolves the workspace package globs for a package.json, checked once at parse time:
 * from the `workspaces` field (Yarn/npm) or, failing that, from a sibling pnpm-workspace.yaml.
 */
export declare const resolveWorkspacesPackagesGlobs: (pkgValue: Pick<PackageJson, "workspaces">, packagePath: string) => string[] | undefined;
//# sourceMappingURL=pnpmWorkspaceYaml.d.ts.map