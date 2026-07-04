import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";
import { workspaceProtocolRule } from "./workspace-protocol.ts";

describe("workspace-protocol", () => {
  it("should report dependency on workspace package not using workspace protocol", async () => {
    const repoCwd = process.cwd();
    const fixtureCwd = path.join(
      repoCwd,
      "fixtures/invalid-workspace-protocol",
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
          "check-package-dependencies-test/workspace-protocol": "error",
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
        ruleId: "check-package-dependencies-test/workspace-protocol",
        severity: 2,
        message:
          'fixture-wp-b: Dependency "fixture-wp-a" in "dependencies" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "^1.0.0"',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });

  it("should report dependency on workspace package not using workspace protocol (pnpm-workspace.yaml)", async () => {
    const repoCwd = process.cwd();
    const fixtureCwd = path.join(
      repoCwd,
      "fixtures/invalid-workspace-protocol-pnpm",
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
          "check-package-dependencies-test/workspace-protocol": "error",
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
        ruleId: "check-package-dependencies-test/workspace-protocol",
        severity: 2,
        message:
          'fixture-wp-pnpm-b: Dependency "fixture-wp-pnpm-a" in "dependencies" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "^1.0.0"',
        line: 1,
        column: 1,
        endLine: 1,
        endColumn: 1,
      },
    ]);
  });

  it("should not report when workspace protocol is used", async () => {
    const { RuleTester } = await import("eslint");
    const tester = new RuleTester({
      plugins: eslintPlugin.configs.recommended.plugins,
      language: "check-package-dependencies/package-json",
    });

    tester.run(
      "workspace-protocol",
      workspaceProtocolRule["workspace-protocol"]!,
      {
        valid: [
          {
            // Non-workspace package: rule does not apply
            code: `${JSON.stringify(
              {
                name: "test",
                dependencies: { somelib: "^1.0.0" },
              },
              null,
              2,
            )}\n`,
            filename: "/tmp/package.json",
          },
        ],
        invalid: [],
      },
    );
  });
});
