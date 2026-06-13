import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("satisfies-versions-in-dependency", () => {
  it("should report when a dependency's dependency does not satisfy the range", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-satisfies-versions-in-dependency",
      ),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/satisfies-versions-in-dependency": [
            "error",
            {
              dependencies: {
                "./mock-dep": {
                  dependencies: {
                    "some-lib": "^1.0.0",
                  },
                },
              },
            },
          ],
        },
      },
    });

    const results = await eslint.lintFiles([
      path.join(
        process.cwd(),
        "fixtures/invalid-satisfies-versions-in-dependency/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId:
          "check-package-dependencies-test/satisfies-versions-in-dependency",
        severity: 2,
        message:
          'some-lib: Invalid "some-lib" in "dependencies" of "mock-dep": "0.1.0" does not satisfies "^1.0.0"',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });
});
