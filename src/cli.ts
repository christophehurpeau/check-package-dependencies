/* eslint-disable no-console */
import fs, { constants } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import type { ESLint as ESLintNamespace } from "eslint";
import checkPackagePlugin from "./eslint-plugin.ts";
import { readPkgJson } from "./utils/pkgJsonUtils.ts";
import { resolveWorkspacesPackagesGlobs } from "./utils/pnpmWorkspaceYaml.ts";

const usage = `Usage: check-package-dependencies [directory] [options]

Lints the package.json of a directory (the current one by default), and the
package.json of every workspace member when it declares workspaces, with the
"recommended" config of eslint-plugin-check-package-dependencies.

Options:
  --fix              apply the fixes the rules provide
  --quiet            report errors only, hiding warnings
  --format <name>    eslint formatter to use (default: "stylish")
  -h, --help         show this help
`;

export interface CliOptions {
  directory: string;
  fix: boolean;
  quiet: boolean;
  format: string;
  help: boolean;
}

export function parseCliArgs(argv: string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      fix: { type: "boolean", default: false },
      quiet: { type: "boolean", default: false },
      format: { type: "string", default: "stylish" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (positionals.length > 1) {
    throw new Error(
      `Expected at most one directory, received ${positionals.length}`,
    );
  }

  return {
    directory: path.resolve(positionals[0] ?? "."),
    fix: values.fix,
    quiet: values.quiet,
    format: values.format,
    help: values.help,
  };
}

/**
 * The package.json files to lint: the one of `directory`, plus the one of every workspace
 * member when it declares workspaces, as most rules check the linted package.json itself.
 */
export function resolvePackageJsonPaths(directory: string): string[] {
  const packageJsonPath = path.join(directory, "package.json");
  const globs = resolveWorkspacesPackagesGlobs(
    readPkgJson(packageJsonPath),
    packageJsonPath,
  );
  if (!globs) return [packageJsonPath];

  const packageJsonPaths = [packageJsonPath];
  for (const match of fs.globSync(globs, { cwd: directory })) {
    if (match.split(path.sep).includes("node_modules")) continue;

    const memberPackageJsonPath = path.join(directory, match, "package.json");
    try {
      fs.accessSync(memberPackageJsonPath, constants.R_OK);
    } catch {
      continue; // a glob also matches directories that are not a package
    }

    packageJsonPaths.push(memberPackageJsonPath);
  }
  return packageJsonPaths;
}

export function hasError(results: ESLintNamespace.LintResult[]): boolean {
  return results.some((result) => result.errorCount > 0);
}

const failWith = (message: string): undefined => {
  console.error(message);
  process.exitCode = 1;
  return undefined;
};

const parseCliArgsOrFail = (argv: string[]): CliOptions | undefined => {
  try {
    return parseCliArgs(argv);
  } catch (error) {
    return failWith(
      `${error instanceof Error ? error.message : String(error)}\n\n${usage}`,
    );
  }
};

const loadESLint = async (): Promise<typeof ESLintNamespace | undefined> => {
  try {
    const eslintModule = await import("eslint");
    return eslintModule.ESLint;
  } catch {
    return failWith(
      'check-package-dependencies requires "eslint" to be installed to run its cli:\n\n  npm install --save-dev eslint\n',
    );
  }
};

const resolvePackageJsonPathsOrFail = (
  directory: string,
): string[] | undefined => {
  try {
    return resolvePackageJsonPaths(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return failWith(`No package.json found in "${directory}"`);
  }
};

export async function main(argv: string[]): Promise<void> {
  const options = parseCliArgsOrFail(argv);
  if (!options) return;

  if (options.help) {
    console.log(usage);
    return;
  }

  const packageJsonPaths = resolvePackageJsonPathsOrFail(options.directory);
  if (!packageJsonPaths) return;

  const ESLint = await loadESLint();
  if (!ESLint) return;

  const eslint = new ESLint({
    cwd: options.directory,
    // the config of the linted project is irrelevant here, only the recommended one applies
    overrideConfigFile: true,
    overrideConfig: [checkPackagePlugin.configs.recommended],
    // the paths are resolved by resolvePackageJsonPaths, never ignore or expand them
    ignore: false,
    globInputPaths: false,
    fix: options.fix,
  });

  const allResults = await eslint.lintFiles(packageJsonPaths);

  if (options.fix) {
    await ESLint.outputFixes(allResults);
  }

  const results = options.quiet
    ? ESLint.getErrorResults(allResults)
    : allResults;
  // the formatter loaded by an ESLint instance is given the rules metadata by it
  const formatter = await eslint.loadFormatter(options.format);
  const output = await formatter.format(results);
  if (output) console.log(output);

  if (hasError(allResults)) {
    process.exitCode = 1;
  }
}
