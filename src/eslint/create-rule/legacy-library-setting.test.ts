import { deepEqual } from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";
import { legacyIsLibrarySettingMessage } from "../../utils/library.ts";

const lintFixtureRoot = async (
  settings: Record<string, unknown>,
  rules: string[],
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
    plugins: { "check-package-dependencies-test": eslintPlugin },
    overrideConfig: {
      files: ["**/package.json"],
      language: "check-package-dependencies-test/package-json",
      settings: { "check-package-dependencies": settings },
      rules: Object.fromEntries(
        rules.map((rule) => [
          `check-package-dependencies-test/${rule}`,
          "error",
        ]),
      ),
    },
  });

  const results = await eslint.lintFiles([
    path.join(fixtureCwd, "package.json"),
  ]);
  process.chdir(repoCwd);

  return results.flatMap((result) =>
    result.messages
      .filter((message) => message.message === legacyIsLibrarySettingMessage)
      .map((message) => message.message),
  );
};

describe("legacy isLibrary setting", () => {
  it("should report it once, whatever the number of rules enabled", async () => {
    deepEqual(
      await lintFixtureRoot({ isLibrary: true }, [
        "consistent-workspace-dependencies",
        "no-root-workspace-dependencies",
        "require-workspace-protocol",
      ]),
      [legacyIsLibrarySettingMessage],
    );
  });

  it("should report it for a single rule too", async () => {
    deepEqual(
      await lintFixtureRoot({ isLibrary: false }, ["require-pinned-versions"]),
      [legacyIsLibrarySettingMessage],
    );
  });

  it("should not report anything with the renamed setting", async () => {
    deepEqual(
      await lintFixtureRoot({ library: true }, [
        "consistent-workspace-dependencies",
        "require-pinned-versions",
      ]),
      [],
    );
  });
});
