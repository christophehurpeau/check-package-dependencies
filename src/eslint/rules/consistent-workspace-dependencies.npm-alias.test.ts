import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { MockedFileContent } from "../eslint.testUtils.ts";
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

const lintRoot = (members: Record<string, MockedFileContent>): string[] =>
  lintPackageJsonMessages(
    "package.json",
    { "package.json": root, ...members },
    { rules: { "consistent-workspace-dependencies": "error" } },
  );

describe("consistent-workspace-dependencies with npm aliases", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should not report members aliasing the same packages with intersecting ranges", () => {
    deepEqual(
      lintRoot({
        "packages/member/package.json": {
          name: "member",
          private: true,
          dependencies: {
            "@typescript/native": "npm:typescript@^7.0.0",
            typescript: "npm:@typescript/typescript6@^6.0.0",
          },
        },
      }),
      [],
    );
  });

  it("should report members aliasing the same package with non intersecting ranges", () => {
    deepEqual(
      lintRoot({
        "packages/member/package.json": {
          name: "member",
          private: true,
          dependencies: { typescript: "npm:@typescript/typescript6@^7.0.0" },
        },
      }),
      [
        'member: Invalid duplicate dependency: "npm:@typescript/typescript6@^7.0.0" should satisfies "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies',
      ],
    );
  });

  it("should report a member installing a different package under the same name", () => {
    deepEqual(
      lintRoot({
        "packages/member/package.json": {
          name: "member",
          private: true,
          dependencies: {
            "@typescript/native": "7.0.2",
            typescript: "^5.0.0",
          },
        },
      }),
      [
        'member: Invalid duplicate dependency: "7.0.2" and "npm:typescript@7.0.2" from alias-root in devDependencies install different packages',
        'member: Invalid duplicate dependency: "^5.0.0" and "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies install different packages',
      ],
    );
  });

  it("should compare the members with each other", () => {
    deepEqual(
      lintRoot({
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
      }),
      [
        'member-b: Invalid duplicate dependency: "npm:other-typescript@6.0.2" and "npm:@typescript/typescript6@6.0.2" from alias-root in devDependencies install different packages',
        'member-b: Invalid duplicate dependency: "npm:other-typescript@6.0.2" and "npm:@typescript/typescript6@6.0.2" from member-a in dependencies install different packages',
      ],
    );
  });
});
