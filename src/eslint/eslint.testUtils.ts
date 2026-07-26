import fs from "node:fs";
import path from "node:path";
import { mock } from "node:test";
import { Linter } from "eslint";
import eslintPlugin from "../eslint-plugin.ts";

const pluginName = "check-package-dependencies";

/** a file of the mocked filesystem, an object being stringified as a package.json would be */
export type MockedFileContent = object | string;

/**
 * The files a test declares, keyed by a path relative to the current working directory.
 *
 * The rules resolve the workspace root and its members from the current working directory,
 * so the mocked filesystem is mounted on it rather than on a directory of its own.
 */
export type MockedFiles = Record<string, MockedFileContent>;

const stringifyContent = (content: MockedFileContent): string =>
  typeof content === "string"
    ? content
    : `${JSON.stringify(content, null, 2)}\n`;

const globToRegExp = (glob: string): RegExp =>
  new RegExp(
    `^${glob
      .split("/")
      .map((segment) =>
        segment === "**"
          ? "[^]*"
          : segment
              .replaceAll(/[$()+.?[\\\]^{|}]/g, String.raw`\$&`)
              .replaceAll("*", "[^/]*"),
      )
      .join("/")}$`,
  );

const getAncestorDirectoryPaths = (
  filePaths: Iterable<string>,
): Set<string> => {
  const directoryPaths = new Set<string>();
  for (const filePath of filePaths) {
    for (
      let dirname = path.dirname(filePath);
      dirname !== path.dirname(dirname);
      dirname = path.dirname(dirname)
    ) {
      directoryPaths.add(dirname);
    }
  }
  return directoryPaths;
};

/**
 * Replaces every `fs` read the rules do with `files`. A path `files` does not declare is one
 * the test did not intend to read: it throws, so an unexpected disk read fails loudly instead
 * of silently making the test pass.
 *
 * Call `mock.restoreAll()` in an `afterEach`.
 */
export function mockFileSystem(files: MockedFiles): void {
  const contentByPath = new Map(
    Object.entries(files).map(([filePath, content]) => [
      path.resolve(filePath),
      stringifyContent(content),
    ]),
  );
  const directoryPaths = getAncestorDirectoryPaths(contentByPath.keys());

  const readFile = (target: fs.PathLike): string => {
    const content = contentByPath.get(path.resolve(String(target)));
    if (content === undefined) {
      throw Object.assign(
        new Error(
          `ENOENT: no such file or directory, open '${String(target)}'`,
        ),
        { code: "ENOENT" },
      );
    }
    return content;
  };

  mock.method(fs, "readFileSync", readFile);
  mock.method(fs, "accessSync", (target: fs.PathLike) => {
    readFile(target);
  });
  // node's globSync resolves its matches against "cwd" and returns them relative to it
  mock.method(
    fs,
    "globSync",
    (patterns: string[] | string, options?: { cwd?: string }) => {
      const cwd = path.resolve(options?.cwd ?? process.cwd());
      const matchers = (Array.isArray(patterns) ? patterns : [patterns]).map(
        (pattern) => globToRegExp(pattern),
      );
      return [...directoryPaths, ...contentByPath.keys()]
        .map((entryPath) => path.relative(cwd, entryPath))
        .filter(
          (relativePath) =>
            relativePath !== "" &&
            !relativePath.startsWith("..") &&
            matchers.some((matcher) => matcher.test(relativePath)),
        )
        .toSorted();
    },
  );
}

export interface LintPackageJsonOptions {
  /** rule name, without the plugin prefix, to its configuration */
  rules: Record<string, Linter.RuleEntry>;
  /** the "check-package-dependencies" settings */
  settings?: Record<string, unknown>;
}

const createConfig = ({
  rules,
  settings = {},
}: LintPackageJsonOptions): Linter.Config[] => [
  {
    files: ["**/package.json"],
    plugins: { [pluginName]: eslintPlugin },
    language: `${pluginName}/package-json`,
    settings: { [pluginName]: settings },
    rules: Object.fromEntries(
      Object.entries(rules).map(([ruleName, entry]) => [
        `${pluginName}/${ruleName}`,
        entry,
      ]),
    ),
  },
];

const getContentToLint = (filePath: string, files: MockedFiles): string => {
  const content = files[filePath];
  if (content === undefined) {
    throw new Error(`Missing mocked file "${filePath}"`);
  }
  mockFileSystem(files);
  return stringifyContent(content);
};

/**
 * Lints one of the mocked `package.json` files. Nothing is read from the disk: the linted
 * content comes from `files`, and so does everything the rules read about the other packages.
 */
export function lintPackageJson(
  filePath: string,
  files: MockedFiles,
  options: LintPackageJsonOptions,
): Linter.LintMessage[] {
  return new Linter().verify(
    getContentToLint(filePath, files),
    createConfig(options),
    path.resolve(filePath),
  );
}

/** Same as {@link lintPackageJson}, returning only the messages. */
export function lintPackageJsonMessages(
  filePath: string,
  files: MockedFiles,
  options: LintPackageJsonOptions,
): string[] {
  return lintPackageJson(filePath, files, options).map(
    (message) => message.message,
  );
}

/** Same as {@link lintPackageJson}, returning the content `eslint --fix` would write. */
export function fixPackageJson(
  filePath: string,
  files: MockedFiles,
  options: LintPackageJsonOptions,
): string {
  return new Linter().verifyAndFix(
    getContentToLint(filePath, files),
    createConfig(options),
    path.resolve(filePath),
  ).output;
}
