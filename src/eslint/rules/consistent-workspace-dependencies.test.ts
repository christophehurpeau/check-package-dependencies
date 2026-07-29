import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import type { Linter } from "eslint";
import eslintPlugin from "../../eslint-plugin.ts";

const fixtureDirectoryPath = path.join(
  process.cwd(),
  "fixtures/invalid-workspace-dependencies",
);

before(() => {
  execSync("pnpm install --frozen-lockfile", { cwd: fixtureDirectoryPath });
});

// "fixture-workspace-a" depends on "semver": "^7.0.0", "fixture-workspace-b" on "^6.0.0",
// so the conflict belongs to "fixture-workspace-b", the package that has to be raised
const lintFixturePackageJson = async (
  relativePath: string,
): Promise<Linter.LintMessage[]> => {
  const repoCwd = process.cwd();
  process.chdir(fixtureDirectoryPath);
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({
    cwd: fixtureDirectoryPath,
    ignore: false,
    plugins: { "check-package-dependencies-test": eslintPlugin },
    overrideConfig: {
      rules: {
        "check-package-dependencies-test/consistent-workspace-dependencies":
          "error",
      },
    },
  });

  const results = await eslint.lintFiles([
    path.join(fixtureDirectoryPath, relativePath),
  ]);
  process.chdir(repoCwd);

  return results.flatMap((result) => result.messages);
};

describe("consistent-workspace-dependencies", () => {
  it("should report nothing on the workspace root", async () => {
    deepEqual(await lintFixturePackageJson("package.json"), []);
  });

  it("should report nothing on the workspace package with the higher range", async () => {
    deepEqual(await lintFixturePackageJson("packages/a/package.json"), []);
  });

  it("should report the workspace package with the lower range, with a fix", async () => {
    deepEqual(await lintFixturePackageJson("packages/b/package.json"), [
      {
        ruleId:
          "check-package-dependencies-test/consistent-workspace-dependencies",
        severity: 2,
        message:
          'dependencies > semver: Invalid duplicate dependency: "^6.0.0" should satisfies "^7.0.0" from fixture-workspace-a in dependencies',
        line: 6,
        column: 15,
        endLine: 6,
        endColumn: 23,
        fix: { range: [108, 116], text: '"^7.0.0"' },
      },
    ]);
  });
});
