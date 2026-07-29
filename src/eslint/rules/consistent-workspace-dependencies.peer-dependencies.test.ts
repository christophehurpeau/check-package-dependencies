import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import type { MockedFiles } from "../eslint.testUtils.ts";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

const rules = { "consistent-workspace-dependencies": "error" } as const;

const filesWith = (
  memberARange: string,
  memberBRange: string,
): MockedFiles => ({
  "package.json": {
    name: "wd-root",
    private: true,
    workspaces: ["packages/*"],
  },
  "packages/a/package.json": {
    name: "member-a",
    version: "1.0.0",
    peerDependencies: { react: memberARange },
  },
  "packages/b/package.json": {
    name: "member-b",
    version: "1.0.0",
    peerDependencies: { react: memberBRange },
  },
});

describe("consistent-workspace-dependencies peerDependencies of the workspace members", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report incompatible peerDependencies ranges on the member to raise", () => {
    const files = filesWith("^18.0.0", "^19.0.0");

    deepEqual(
      lintPackageJsonMessages("packages/a/package.json", files, { rules }),
      [
        'peerDependencies > react: Invalid duplicate dependency: "^18.0.0" should satisfies "^19.0.0" from member-b in peerDependencies',
      ],
    );
    deepEqual(
      lintPackageJsonMessages("packages/b/package.json", files, { rules }),
      [],
    );
  });

  it("should not report compatible peerDependencies ranges", () => {
    const files = filesWith("^18.0.0", "^18.2.0");

    deepEqual(
      lintPackageJsonMessages("packages/a/package.json", files, { rules }),
      [],
    );
    deepEqual(
      lintPackageJsonMessages("packages/b/package.json", files, { rules }),
      [],
    );
  });

  it("should not compare peerDependencies with the other dependency types", () => {
    const files: MockedFiles = {
      "package.json": {
        name: "wd-root",
        private: true,
        workspaces: ["packages/*"],
        devDependencies: { react: "18.0.0" },
      },
      "packages/a/package.json": {
        name: "member-a",
        version: "1.0.0",
        peerDependencies: { react: "^19.0.0" },
      },
    };

    deepEqual(
      lintPackageJsonMessages("packages/a/package.json", files, { rules }),
      [],
    );
  });
});
