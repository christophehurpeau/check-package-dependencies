import fs, { constants } from "node:fs";
import path from "node:path";
import type { PackageJson } from "./packageTypes.ts";

const stripListItemValue = (rawValue: string): string => {
  const withoutComment = rawValue.replace(/(?:^|\s)#.*$/, "").trim();
  const quoted = /^['"](.*)['"]$/.exec(withoutComment);
  return quoted ? quoted[1]! : withoutComment;
};

const parseFlowSequence = (flowValue: string): string[] =>
  flowValue
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .split(",")
    .map((item) => stripListItemValue(item))
    .filter((item) => item.length > 0);

/** Minimal parser for the `packages:` list in pnpm-workspace.yaml, avoiding a full YAML dependency. */
export const parsePnpmWorkspacePackages = (content: string): string[] => {
  const lines = content.split(/\r?\n/);
  const packagesLineIndex = lines.findIndex((line) =>
    line.startsWith("packages:"),
  );
  if (packagesLineIndex === -1) return [];

  const packagesLine = lines[packagesLineIndex]!;
  const inlineValue = packagesLine.slice("packages:".length).trim();
  if (inlineValue.startsWith("[")) {
    return parseFlowSequence(inlineValue);
  }

  const packages: string[] = [];
  for (let i = packagesLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i]!;
    if (line.trim().length === 0) continue;
    const trimmedLine = line.trimStart();
    if (line === trimmedLine || !trimmedLine.startsWith("-")) break;
    const value = stripListItemValue(trimmedLine.slice(1));
    if (value.length > 0) packages.push(value);
  }
  return packages;
};

const readPnpmWorkspacePackages = (dirname: string): string[] | undefined => {
  const pnpmWorkspacePath = path.join(dirname, "pnpm-workspace.yaml");
  try {
    fs.accessSync(pnpmWorkspacePath, constants.R_OK);
  } catch {
    return undefined;
  }
  const content = fs.readFileSync(pnpmWorkspacePath, "utf8");
  const packages = parsePnpmWorkspacePackages(content);
  return packages.length > 0 ? packages : undefined;
};

/**
 * Resolves the workspace package globs for a package.json, checked once at parse time:
 * from the `workspaces` field (Yarn/npm) or, failing that, from a sibling pnpm-workspace.yaml.
 */
export const resolveWorkspacesPackagesGlobs = (
  pkgValue: Pick<PackageJson, "workspaces">,
  packagePath: string,
): string[] | undefined =>
  (pkgValue.workspaces && !Array.isArray(pkgValue.workspaces)
    ? pkgValue.workspaces.packages
    : pkgValue.workspaces) ??
  readPnpmWorkspacePackages(path.dirname(packagePath));
