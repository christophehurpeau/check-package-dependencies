import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

// both members declare "semver" in dependencies and devDependencies, which only a
// library is allowed to do
const memberDependencies = {
  dependencies: { semver: "^7.0.0" },
  devDependencies: { semver: "7.8.5" },
};

const files = {
  "package.json": {
    name: "wd-root",
    private: true,
    workspaces: ["packages/*"],
    devDependencies: { semver: "7.8.5" },
  },
  "packages/library-member/package.json": {
    name: "library-member",
    version: "1.0.0",
    ...memberDependencies,
  },
  "packages/private-member/package.json": {
    name: "private-member",
    private: true,
    ...memberDependencies,
  },
};

const lintMember = (
  memberDirectoryName: string,
  settings: Record<string, unknown>,
): string[] =>
  lintPackageJsonMessages(
    `packages/${memberDirectoryName}/package.json`,
    files,
    { settings, rules: { "consistent-workspace-dependencies": "error" } },
  );

const duplicateMessage =
  'Invalid "semver" present in devDependencies and dependencies: please place it only in dependencies';

describe("consistent-workspace-dependencies library setting of the workspace members", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should detect it for each member when there is no setting", () => {
    deepEqual(lintMember("library-member", {}), []);
    deepEqual(lintMember("private-member", {}), [duplicateMessage]);
  });

  it('should detect it for each member with "auto"', () => {
    deepEqual(lintMember("library-member", { library: "auto" }), []);
    deepEqual(lintMember("private-member", { library: "auto" }), [
      duplicateMessage,
    ]);
  });

  it("should apply true to every member", () => {
    deepEqual(lintMember("library-member", { library: true }), []);
    deepEqual(lintMember("private-member", { library: true }), []);
  });

  it("should apply false to every member", () => {
    deepEqual(lintMember("library-member", { library: false }), [
      duplicateMessage,
    ]);
    deepEqual(lintMember("private-member", { library: false }), [
      duplicateMessage,
    ]);
  });

  it("should apply a list of package name patterns to the members", () => {
    deepEqual(lintMember("library-member", { library: ["library-*"] }), []);
    deepEqual(lintMember("private-member", { library: ["library-*"] }), [
      duplicateMessage,
    ]);
  });
});
