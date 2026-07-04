import fs from "node:fs";
import path from "node:path";
import type { PackageJson } from "./packageTypes.ts";
import { resolveWorkspacesPackagesGlobs } from "./pnpmWorkspaceYaml.ts";

const readPackageJsonSafe = (
  packageJsonPath: string,
): PackageJson | undefined => {
  try {
    // eslint-disable-next-line unicorn/prefer-json-parse-buffer -- JSON.parse's TS types require a string
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJson;
  } catch {
    return undefined;
  }
};

/**
 * Finds the nearest ancestor package.json declaring workspaces (a `workspaces` field or a
 * sibling pnpm-workspace.yaml), starting from `startDirname`, and returns the `name` of
 * every workspace member package. Lets a rule check a workspace member's own file for
 * cross-workspace-package issues without needing to be run against the root package.json.
 */
export const findWorkspaceMemberNames = (
  startDirname: string,
): Set<string> | undefined => {
  for (let dirname = startDirname; ; ) {
    const packageJsonPath = path.join(dirname, "package.json");
    const pkgValue = readPackageJsonSafe(packageJsonPath);
    if (pkgValue) {
      const globs = resolveWorkspacesPackagesGlobs(pkgValue, packageJsonPath);
      if (globs) {
        const names = new Set<string>();
        for (const match of fs.globSync(globs, { cwd: dirname })) {
          const memberPkg = readPackageJsonSafe(
            path.join(match, "package.json"),
          );
          if (memberPkg?.name) names.add(memberPkg.name);
        }
        return names;
      }
    }

    const parentDirname = path.dirname(dirname);
    if (parentDirname === dirname) return undefined;
    dirname = parentDirname;
  }
};
