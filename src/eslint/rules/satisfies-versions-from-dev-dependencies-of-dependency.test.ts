import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("satisfies-versions-from-dev-dependencies-of-dependency", () => {
  it("should report when version does not satisfy dev dependency's range", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-versions-from-dev-dependencies-of-dependency",
      ),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/satisfies-versions-from-dev-dependencies-of-dependency":
            [
              "error",
              {
                dependencies: {
                  "./mock-dep": {
                    dependencies: ["some-lib"],
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
        "fixtures/invalid-versions-from-dev-dependencies-of-dependency/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId:
          "check-package-dependencies-test/satisfies-versions-from-dev-dependencies-of-dependency",
        severity: 2,
        column: 5,
        endColumn: 25,
        endLine: 6,
        line: 6,
        message:
          'dependencies > some-lib: Invalid: "^0.5.0" should satisfies "^0.4.0"',
      },
    ]);
  });
});
