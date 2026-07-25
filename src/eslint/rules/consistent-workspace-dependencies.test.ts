import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

before(() => {
  execSync(
    "yarn install --frozen-lockfile --cache-folder /tmp/yarn-cache-workspace-deps",
    {
      cwd: path.join(process.cwd(), "fixtures/invalid-workspace-dependencies"),
    },
  );
});

describe("consistent-workspace-dependencies", () => {
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
          "check-package-dependencies-test/consistent-workspace-dependencies":
            "error",
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
        ruleId:
          "check-package-dependencies-test/consistent-workspace-dependencies",
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

  describe("library setting of the workspace members", () => {
    const lintFixtureRoot = async (
      settings: Record<string, unknown>,
    ): Promise<string[]> => {
      const repoCwd = process.cwd();
      const fixtureCwd = path.join(
        repoCwd,
        "fixtures/workspace-dependencies-library",
      );
      process.chdir(fixtureCwd);
      const { ESLint } = await import("eslint");
      const eslint = new ESLint({
        cwd: fixtureCwd,
        ignore: false,
        overrideConfigFile: true,
        plugins: {
          "check-package-dependencies-test": eslintPlugin,
        },
        overrideConfig: {
          files: ["**/package.json"],
          language: "check-package-dependencies-test/package-json",
          settings: { "check-package-dependencies": settings },
          rules: {
            "check-package-dependencies-test/consistent-workspace-dependencies":
              "error",
          },
        },
      });

      const results = await eslint.lintFiles([
        path.join(fixtureCwd, "package.json"),
      ]);
      process.chdir(repoCwd);

      return results.flatMap((result) =>
        result.messages.map((message) => message.message),
      );
    };

    // the fixture members both declare "semver" in dependencies and devDependencies,
    // which only a library is allowed to do
    const duplicateMessageFor = (memberName: string): string =>
      `${memberName}: Invalid "semver" present in devDependencies and dependencies: please place it only in dependencies`;
    const autoDetectedMessages = [
      duplicateMessageFor("fixture-workspace-private-member"),
    ];

    it("should detect it for each member when there is no setting", async () => {
      deepEqual(await lintFixtureRoot({}), autoDetectedMessages);
    });

    it('should detect it for each member with "auto"', async () => {
      deepEqual(
        await lintFixtureRoot({ library: "auto" }),
        autoDetectedMessages,
      );
    });

    it("should apply true to every member", async () => {
      deepEqual(await lintFixtureRoot({ library: true }), []);
    });

    it("should apply false to every member", async () => {
      deepEqual(await lintFixtureRoot({ library: false }), [
        duplicateMessageFor("fixture-workspace-library-member"),
        duplicateMessageFor("fixture-workspace-private-member"),
      ]);
    });

    it("should apply a list of package name patterns to the members", async () => {
      deepEqual(
        await lintFixtureRoot({ library: ["fixture-workspace-library-*"] }),
        autoDetectedMessages,
      );
    });
  });
});
