import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

describe("consistent-workspace-dependencies on a package that is not in a workspace", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report nothing, there is no workspace root to compare with", () => {
    deepEqual(
      lintPackageJsonMessages(
        "package.json",
        {
          "package.json": {
            name: "standalone",
            private: true,
            dependencies: { semver: "^7.8.5" },
          },
        },
        { rules: { "consistent-workspace-dependencies": "error" } },
      ),
      [],
    );
  });
});
