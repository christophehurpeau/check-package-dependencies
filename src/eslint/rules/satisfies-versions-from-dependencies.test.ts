import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("satisfies-versions-from-dependencies", () => {
  it("should report when versions do not satisfy between dependencies", async () => {
    // uses fixtures in __tests__/fixtures/satisfies-versions-between-dependencies

    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/satisfies-versions-from-dependencies":
            [
              "error",
              {
                dependencies: {
                  eslint: {
                    dependencies: ["@eslint/plugin-kit"],
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
        "fixtures/invalid-versions-between-dependencies/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId:
          "check-package-dependencies-test/satisfies-versions-from-dependencies",
        severity: 2,
        column: 5,
        endColumn: 35,
        endLine: 5,
        line: 5,
        message:
          'dependencies > @eslint/plugin-kit: Invalid: "^0.5.0" should satisfies "^0.4.0"',
      },
    ]);
  });
});
