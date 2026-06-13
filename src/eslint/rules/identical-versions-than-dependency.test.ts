import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("identical-versions-than-dependency", () => {
  it("should report when version does not match dependency's version", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-identical-versions-than-dependency",
      ),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/identical-versions-than-dependency":
            [
              "error",
              {
                dependencies: {
                  "./mock-dep": {
                    devDependencies: ["some-lib"],
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
        "fixtures/invalid-identical-versions-than-dependency/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId:
          "check-package-dependencies-test/identical-versions-than-dependency",
        severity: 2,
        column: 5,
        endColumn: 24,
        endLine: 6,
        line: 6,
        message:
          'devDependencies > some-lib: Invalid "1.1.0": expecting "1.1.0" to be "1.0.0" from "mock-dep"',
      },
    ]);
  });
});
