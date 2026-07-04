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
      path.join(fixtureCwd, "packages/*/package.json"),
    ]);
    process.chdir(repoCwd);

    const messages = results
      .filter((result) => result.messages.length > 0)
      .map((result) => ({
        file: path.relative(fixtureCwd, result.filePath),
        messages: result.messages,
      }));

    deepEqual(messages, [
      {
        file: "packages/pkg-b/package.json",
        messages: [
          {
            ruleId: "check-package-dependencies-test/workspace-protocol",
            severity: 2,
            message:
              'dependencies > fixture-wp-a: Dependency "fixture-wp-a" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "^1.0.0"',
            line: 6,
            column: 5,
            endLine: 6,
            endColumn: 29,
          },
        ],
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
      path.join(fixtureCwd, "packages/*/package.json"),
    ]);
    process.chdir(repoCwd);

    const messages = results
      .filter((result) => result.messages.length > 0)
      .map((result) => ({
        file: path.relative(fixtureCwd, result.filePath),
        messages: result.messages,
      }));

    deepEqual(messages, [
      {
        file: "packages/pkg-b/package.json",
        messages: [
          {
            ruleId: "check-package-dependencies-test/workspace-protocol",
            severity: 2,
            message:
              'dependencies > fixture-wp-pnpm-a: Dependency "fixture-wp-pnpm-a" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "^1.0.0"',
            line: 6,
            column: 5,
            endLine: 6,
            endColumn: 34,
          },
        ],
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
