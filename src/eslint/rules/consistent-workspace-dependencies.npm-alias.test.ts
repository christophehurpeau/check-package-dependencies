import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { MockedFileContent, MockedFiles } from "../eslint.testUtils.ts";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

// semver cannot parse an alias as a range, so the raw value used to throw
const root = {
  name: "alias-root",
  private: true,
  workspaces: ["packages/*"],
  devDependencies: {
    "@typescript/native": "npm:typescript@7.0.2",
    typescript: "npm:@typescript/typescript6@6.0.2",
  },
};

const withRoot = (members: MockedFiles): MockedFiles => ({
  "package.json": root,
  ...members,
});

const lintRoot = (members: MockedFiles): string[] =>
  lintPackageJsonMessages("package.json", withRoot(members), {
    rules: { "consistent-workspace-dependencies": "error" },
  });

const lintMember = (
  memberDirectoryName: string,
  members: Record<string, MockedFileContent>,
): string[] =>
  lintPackageJsonMessages(
    `packages/${memberDirectoryName}/package.json`,
    withRoot(members),
    { rules: { "consistent-workspace-dependencies": "error" } },
  );

describe("consistent-workspace-dependencies with npm aliases", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should not report members aliasing the same packages with intersecting ranges", () => {
    const members = {
      "packages/member/package.json": {
        name: "member",
        private: true,
        dependencies: {
          "@typescript/native": "npm:typescript@^7.0.0",
          typescript: "npm:@typescript/typescript6@^6.0.0",
        },
      },
    };

    deepEqual(lintMember("member", members), []);
    deepEqual(lintRoot(members), []);
  });

  it("should report the member aliasing the same package with a lower range", () => {
    const members = {
      "packages/member/package.json": {
        name: "member",
        private: true,
        dependencies: { typescript: "npm:@typescript/typescript6@^5.0.0" },
      },
    };

    deepEqual(lintMember("member", members), [
      'dependencies > typescript: Invalid duplicate dependency: "npm:@typescript/typescript6@^5.0.0" should satisfies "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies',
    ]);
    deepEqual(lintRoot(members), []);
  });

  it("should report the workspace root when its aliased range is the lower one", () => {
    const members = {
      "packages/member/package.json": {
        name: "member",
        private: true,
        dependencies: { typescript: "npm:@typescript/typescript6@^7.0.0" },
      },
    };

    deepEqual(lintRoot(members), [
      'devDependencies > typescript: Invalid duplicate dependency: "npm:@typescript/typescript6@6.0.2" should satisfies "npm:@typescript/typescript6@^7.0.0" from member in dependencies',
    ]);
    deepEqual(lintMember("member", members), []);
  });

  it("should report a member installing a different package under the same name", () => {
    // neither range can be raised into the other: the member owns the conflict with the root
    const members = {
      "packages/member/package.json": {
        name: "member",
        private: true,
        dependencies: {
          "@typescript/native": "7.0.2",
          typescript: "^5.0.0",
        },
      },
    };

    deepEqual(lintMember("member", members), [
      'dependencies > @typescript/native: Invalid duplicate dependency: "7.0.2" and "npm:typescript@7.0.2" from alias-root in devDependencies install different packages',
      'dependencies > typescript: Invalid duplicate dependency: "^5.0.0" and "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies install different packages',
    ]);
    deepEqual(lintRoot(members), []);
  });

  it("should compare the members with each other", () => {
    // "member-a" and "member-b" install different packages under "typescript": the conflict
    // is unordered, so it is reported on the member sorting first, from its own package.json
    const members = {
      "packages/member-a/package.json": {
        name: "member-a",
        private: true,
        dependencies: { typescript: "npm:@typescript/typescript6@6.0.2" },
      },
      "packages/member-b/package.json": {
        name: "member-b",
        private: true,
        dependencies: { typescript: "npm:other-typescript@6.0.2" },
      },
    };

    deepEqual(lintMember("member-a", members), [
      'dependencies > typescript: Invalid duplicate dependency: "npm:@typescript/typescript6@6.0.2" and "npm:other-typescript@6.0.2" from member-b in dependencies install different packages',
    ]);
    deepEqual(lintMember("member-b", members), [
      'dependencies > typescript: Invalid duplicate dependency: "npm:other-typescript@6.0.2" and "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies install different packages',
    ]);
    deepEqual(lintRoot(members), []);
  });
});
