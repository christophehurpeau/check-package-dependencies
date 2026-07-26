import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { MockedFiles } from "../eslint.testUtils.ts";
import { fixPackageJson, lintPackageJson } from "../eslint.testUtils.ts";

const memberB = {
  name: "wp-b",
  private: true,
  type: "module",
  dependencies: { "wp-a": "^1.0.0" },
};

const memberBPath = "packages/pkg-b/package.json";

const members = {
  "packages/pkg-a/package.json": { name: "wp-a", private: true },
  [memberBPath]: memberB,
};

const workspacesFieldFiles: MockedFiles = {
  "package.json": {
    name: "wp-root",
    private: true,
    workspaces: ["packages/*"],
  },
  ...members,
};

const pnpmWorkspaceFiles: MockedFiles = {
  "package.json": { name: "wp-root", private: true },
  "pnpm-workspace.yaml": 'packages:\n  - "packages/*"\n',
  ...members,
};

const rules = { "require-workspace-protocol": "error" as const };

const expectedMessage = {
  ruleId: "check-package-dependencies/require-workspace-protocol",
  severity: 2,
  message:
    'dependencies > wp-a: Dependency "wp-a" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "^1.0.0"',
  line: 6,
  column: 13,
  endLine: 6,
  endColumn: 21,
  fix: { range: [91, 99], text: '"workspace:^"' },
};

const fixedMemberB = `${JSON.stringify(
  { ...memberB, dependencies: { "wp-a": "workspace:^" } },
  null,
  2,
)}\n`;

describe("require-workspace-protocol", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report a dependency on a workspace package declared with a range", () => {
    deepEqual(lintPackageJson(memberBPath, workspacesFieldFiles, { rules }), [
      expectedMessage,
    ]);
  });

  it("should fix it to the workspace protocol", () => {
    deepEqual(
      fixPackageJson(memberBPath, workspacesFieldFiles, { rules }),
      fixedMemberB,
    );
  });

  it("should find the workspace members from pnpm-workspace.yaml too", () => {
    deepEqual(lintPackageJson(memberBPath, pnpmWorkspaceFiles, { rules }), [
      expectedMessage,
    ]);
    deepEqual(
      fixPackageJson(memberBPath, pnpmWorkspaceFiles, { rules }),
      fixedMemberB,
    );
  });

  it("should not report a package that is not in a workspace", () => {
    deepEqual(
      lintPackageJson(
        "package.json",
        {
          "package.json": { name: "test", dependencies: { somelib: "^1.0.0" } },
        },
        { rules },
      ),
      [],
    );
  });
});
