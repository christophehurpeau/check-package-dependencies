import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJson } from "../eslint.testUtils.ts";

describe("satisfies-versions-in-dependency", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report when a dependency's dependency does not satisfy the range", () => {
    deepEqual(
      lintPackageJson(
        "package.json",
        {
          "package.json": { name: "test", private: true },
          "mock-dep/package.json": {
            name: "mock-dep",
            version: "1.0.0",
            dependencies: { "some-lib": "0.1.0" },
          },
        },
        {
          rules: {
            "satisfies-versions-in-dependency": [
              "error",
              {
                dependencies: {
                  "./mock-dep": { dependencies: { "some-lib": "^1.0.0" } },
                },
              },
            ],
          },
        },
      ),
      [
        {
          ruleId: "check-package-dependencies/satisfies-versions-in-dependency",
          severity: 2,
          message:
            'some-lib: Invalid "some-lib" in "dependencies" of "mock-dep": "0.1.0" does not satisfies "^1.0.0"',
          line: 1,
          column: 1,
          endLine: 1,
          endColumn: 1,
        },
      ],
    );
  });
});
