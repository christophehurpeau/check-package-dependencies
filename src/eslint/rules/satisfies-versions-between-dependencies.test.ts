import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("satisfies-versions-between-dependencies", () => {
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
          "check-package-dependencies-test/satisfies-versions-between-dependencies":
            [
              "error",
              {
                dependencies: [
                  {
                    name: "@eslint/core",
                    from: "eslint",
                    to: "@eslint/plugin-kit",
                  },
                ],
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
          "check-package-dependencies-test/satisfies-versions-between-dependencies",
        severity: 2,
        message:
          'Version not satisfied between dependencies for dependency "@eslint/core": "^0.16.0" from "eslint" dependencies should satisfies "^1.0.1" from "@eslint/plugin-kit" dependencies',
        line: 1,
        column: 1,
        nodeType: null,
        endLine: 1,
        endColumn: 1,
      },
      {
        ruleId: "check-package-dependencies/direct-duplicate-dependencies",
        severity: 2,
        message:
          'dependencies > @eslint/plugin-kit: Invalid duplicate dependency: "^0.5.0" should satisfies "^0.4.0" from eslint in dependencies',
        line: 5,
        column: 5,
        nodeType: null,
        endLine: 5,
        endColumn: 35,
      },
    ]);
  });
});
