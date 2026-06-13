import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

before(() => {
  execSync(
    "yarn install --frozen-lockfile --cache-folder /tmp/yarn-test-cache",
    {
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-direct-peer-dependencies",
      ),
    },
  );
});

describe("direct-peer-dependencies", () => {
  it("should report missing peer dependency", async () => {
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: path.join(
        process.cwd(),
        "fixtures/invalid-direct-peer-dependencies",
      ),
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/direct-peer-dependencies": "error",
        },
      },
    });

    const results = await eslint.lintFiles([
      path.join(
        process.cwd(),
        "fixtures/invalid-direct-peer-dependencies/package.json",
      ),
    ]);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId: "check-package-dependencies-test/direct-peer-dependencies",
        severity: 2,
        message:
          'eslint: Missing "eslint" peer dependency from "@eslint-community/eslint-utils" in "dependencies": it should satisfies "^6.0.0 || ^7.0.0 || >=8.0.0" and be in devDependencies or dependencies',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });
});
