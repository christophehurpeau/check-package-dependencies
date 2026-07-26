import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJson } from "../eslint.testUtils.ts";

describe("satisfies-versions-from-dev-dependencies-of-dependency", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report when version does not satisfy dev dependency's range", () => {
    deepEqual(
      lintPackageJson(
        "package.json",
        {
          "package.json": {
            name: "test",
            private: true,
            dependencies: { "some-lib": "^0.5.0" },
          },
          "mock-dep/package.json": {
            name: "mock-dep",
            version: "1.0.0",
            devDependencies: { "some-lib": "^0.4.0" },
          },
        },
        {
          rules: {
            "satisfies-versions-from-dev-dependencies-of-dependency": [
              "error",
              {
                dependencies: {
                  "./mock-dep": { dependencies: ["some-lib"] },
                },
              },
            ],
          },
        },
      ),
      [
        {
          ruleId:
            "check-package-dependencies/satisfies-versions-from-dev-dependencies-of-dependency",
          severity: 2,
          message:
            'dependencies > some-lib: Invalid: "^0.5.0" should satisfies "^0.4.0"',
          line: 5,
          column: 5,
          endLine: 5,
          endColumn: 25,
        },
      ],
    );
  });
});
