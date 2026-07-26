import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJson } from "../eslint.testUtils.ts";

describe("require-identical-versions-as-dependency", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report when version does not match dependency's version", () => {
    deepEqual(
      lintPackageJson(
        "package.json",
        {
          "package.json": {
            name: "test",
            private: true,
            devDependencies: { "some-lib": "1.1.0" },
          },
          "mock-dep/package.json": {
            name: "mock-dep",
            version: "1.0.0",
            dependencies: { "some-lib": "1.0.0" },
          },
        },
        {
          rules: {
            "require-identical-versions-as-dependency": [
              "error",
              {
                dependencies: {
                  "./mock-dep": { devDependencies: ["some-lib"] },
                },
              },
            ],
          },
        },
      ),
      [
        {
          ruleId:
            "check-package-dependencies/require-identical-versions-as-dependency",
          severity: 2,
          message:
            'devDependencies > some-lib: Invalid "1.1.0": expecting "1.1.0" to be "1.0.0" from "mock-dep"',
          line: 5,
          column: 5,
          endLine: 5,
          endColumn: 24,
        },
      ],
    );
  });
});
