import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

before(() => {
  execSync("yarn install --frozen-lockfile", {
    cwd: path.join(process.cwd(), "fixtures/invalid-workspace-dependencies"),
  });
});

describe("workspace-dependencies", () => {
  it("should report duplicate dependency between workspaces", async () => {
    const repoCwd = process.cwd();
    const fixtureCwd = path.join(
      repoCwd,
      "fixtures/invalid-workspace-dependencies",
    );
    process.chdir(fixtureCwd);
    const { ESLint } = await import("eslint");
    const eslint = new ESLint({
      cwd: fixtureCwd,
      ignore: false,
      plugins: {
        "check-package-dependencies-test": eslintPlugin,
      },
      overrideConfig: {
        rules: {
          "check-package-dependencies-test/workspace-dependencies": "error",
        },
      },
    });

    const results = await eslint.lintFiles([
      path.join(fixtureCwd, "package.json"),
    ]);
    process.chdir(repoCwd);

    const messages = results.flatMap((result) => result.messages);

    deepEqual(messages, [
      {
        ruleId: "check-package-dependencies-test/workspace-dependencies",
        severity: 2,
        message:
          'fixture-workspace-b: Invalid duplicate dependency: "^6.0.0" should satisfies "^7.0.0" from fixture-workspace-a in dependencies',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });
});
