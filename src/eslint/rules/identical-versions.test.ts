import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

describe("identical-versions", () => {
  it("should report when versions are not identical", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(process.cwd(), "fixtures/invalid-identical-versions"),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/identical-versions": [
            "error",
            {
              devDependencies: {
                react: ["react-dom"],
              },
            },
          ],
        },
      },
    });

    const results = await eslint.lintFiles([
      path.join(
        process.cwd(),
        "fixtures/invalid-identical-versions/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId: "check-package-dependencies-test/identical-versions",
        severity: 2,
        column: 5,
        endColumn: 25,
        endLine: 7,
        line: 7,
        message:
          'devDependencies > react-dom: Invalid "react-dom": expecting "1.0.1" to be "1.0.0" identical to "react" in "devDependencies"',
      },
    ]);
  });
});
