import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

before(() => {
  execSync(
    "yarn install --frozen-lockfile --cache-folder /tmp/yarn-cache-direct-dup",
    {
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-direct-duplicate-dependencies",
      ),
    },
  );
});

describe("direct-duplicate-dependencies", () => {
  it("should report duplicate dependency with non-intersecting version", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-direct-duplicate-dependencies",
      ),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/direct-duplicate-dependencies":
            "error",
        },
      },
    });

    const results = await eslint.lintFiles([
      path.join(
        process.cwd(),
        "fixtures/invalid-direct-duplicate-dependencies/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId: "check-package-dependencies-test/direct-duplicate-dependencies",
        severity: 2,
        message:
          'dependencies > eslint-visitor-keys: Invalid duplicate dependency: "^2.0.0" should satisfies "^3.4.3" from @eslint-community/eslint-utils in dependencies',
        line: 7,
        column: 5,
        endLine: 7,
        endColumn: 36,
      },
    ]);
  });
});
