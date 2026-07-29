import assert from "node:assert/strict";
import path from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import { hasError, parseCliArgs, resolvePackageJsonPaths } from "./cli.ts";
import { mockFileSystem } from "./eslint/eslint.testUtils.ts";

describe("parseCliArgs", () => {
  it("should default to the current directory and no option", () => {
    assert.deepEqual(parseCliArgs([]), {
      directory: process.cwd(),
      fix: false,
      quiet: false,
      format: "stylish",
      help: false,
    });
  });

  it("should resolve the directory positional", () => {
    assert.equal(
      parseCliArgs(["packages/app"]).directory,
      path.resolve("packages/app"),
    );
  });

  it("should parse the options", () => {
    assert.deepEqual(parseCliArgs(["--fix", "--quiet", "--format", "json"]), {
      directory: process.cwd(),
      fix: true,
      quiet: true,
      format: "json",
      help: false,
    });
  });

  it("should parse the help flags", () => {
    assert.equal(parseCliArgs(["--help"]).help, true);
    assert.equal(parseCliArgs(["-h"]).help, true);
  });

  it("should throw for an unknown option", () => {
    assert.throws(() => parseCliArgs(["--unknown"]));
  });

  it("should throw for several directories", () => {
    assert.throws(() => parseCliArgs(["a", "b"]), {
      message: "Expected at most one directory, received 2",
    });
  });
});

describe("resolvePackageJsonPaths", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  const inCwd = (...parts: string[]): string =>
    path.join(process.cwd(), ...parts);

  it("should only lint the package.json of a package without workspaces", () => {
    mockFileSystem({ "package.json": { name: "single" } });

    assert.deepEqual(resolvePackageJsonPaths(process.cwd()), [
      inCwd("package.json"),
    ]);
  });

  it("should lint the root and every workspace member", () => {
    mockFileSystem({
      "package.json": { name: "root", workspaces: ["packages/*"] },
      "packages/a/package.json": { name: "a" },
      "packages/b/package.json": { name: "b" },
    });

    assert.deepEqual(resolvePackageJsonPaths(process.cwd()), [
      inCwd("package.json"),
      inCwd("packages/a/package.json"),
      inCwd("packages/b/package.json"),
    ]);
  });

  it("should resolve the workspace members of a pnpm workspace", () => {
    mockFileSystem({
      "package.json": { name: "root" },
      "pnpm-workspace.yaml": "packages:\n  - packages/*\n",
      "packages/a/package.json": { name: "a" },
    });

    assert.deepEqual(resolvePackageJsonPaths(process.cwd()), [
      inCwd("package.json"),
      inCwd("packages/a/package.json"),
    ]);
  });

  it("should ignore a matched directory without a package.json", () => {
    mockFileSystem({
      "package.json": { name: "root", workspaces: ["packages/*"] },
      "packages/a/package.json": { name: "a" },
      "packages/not-a-package/readme.md": "",
    });

    assert.deepEqual(resolvePackageJsonPaths(process.cwd()), [
      inCwd("package.json"),
      inCwd("packages/a/package.json"),
    ]);
  });

  it("should ignore matches inside node_modules", () => {
    mockFileSystem({
      "package.json": {
        name: "root",
        workspaces: ["packages/*", "node_modules/dep/packages/*"],
      },
      "packages/a/package.json": { name: "a" },
      "node_modules/dep/packages/b/package.json": { name: "b" },
    });

    assert.deepEqual(resolvePackageJsonPaths(process.cwd()), [
      inCwd("package.json"),
      inCwd("packages/a/package.json"),
    ]);
  });

  it("should throw ENOENT when the directory has no package.json", () => {
    mockFileSystem({ "other.json": {} });

    assert.throws(() => resolvePackageJsonPaths(process.cwd()), {
      code: "ENOENT",
    });
  });
});

describe("hasError", () => {
  const result = (
    errorCount: number,
    warningCount: number,
  ): Parameters<typeof hasError>[0][number] => {
    const lintResult: Pick<
      Parameters<typeof hasError>[0][number],
      "errorCount" | "warningCount"
    > = { errorCount, warningCount };
    return lintResult as Parameters<typeof hasError>[0][number];
  };

  it("should be false without any result", () => {
    assert.equal(hasError([]), false);
  });

  it("should be false for warnings only", () => {
    assert.equal(hasError([result(0, 3)]), false);
  });

  it("should be true as soon as one result has an error", () => {
    assert.equal(hasError([result(0, 3), result(1, 0)]), true);
  });
});
