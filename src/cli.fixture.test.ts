import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { after, before, describe, it, mock } from "node:test";
import type { ESLint } from "eslint";
import { main } from "./cli.ts";

const fixtureDirectory = "fixtures/invalid-workspace-dependencies";

before(() => {
  execSync("pnpm install --frozen-lockfile", {
    cwd: path.join(process.cwd(), fixtureDirectory),
  });
});

const runCli = async (argv: string[]): Promise<ESLint.LintResult[]> => {
  const log = mock.method(console, "log", () => undefined);
  try {
    await main([fixtureDirectory, "--format", "json", ...argv]);
  } finally {
    mock.restoreAll();
  }

  const output: unknown = log.mock.calls[0]?.arguments[0];
  assert.equal(typeof output, "string");
  return JSON.parse(output as string) as ESLint.LintResult[];
};

const messagesByPackage = (
  results: ESLint.LintResult[],
): Record<string, string[]> =>
  Object.fromEntries(
    results.map((result) => [
      path.relative(
        path.join(process.cwd(), fixtureDirectory),
        result.filePath,
      ),
      result.messages.map(
        (message) => `${message.ruleId ?? "unknown"}: ${message.message}`,
      ),
    ]),
  );

describe("cli", () => {
  const initialExitCode = process.exitCode;

  after(() => {
    process.exitCode = initialExitCode;
  });

  it("should lint the workspace root and every workspace member with the recommended config", async () => {
    const results = await runCli([]);

    assert.deepEqual(messagesByPackage(results), {
      "package.json": [],
      "packages/a/package.json": [
        'check-package-dependencies/require-pinned-versions: dependencies > semver: Unexpected range value: expecting "^7.0.0" to be exact "7.8.5"',
      ],
      // the duplicate is reported on the package to raise, in the file "--fix" can change
      "packages/b/package.json": [
        'check-package-dependencies/consistent-workspace-dependencies: dependencies > semver: Invalid duplicate dependency: "^6.0.0" should satisfies "^7.0.0" from fixture-workspace-a in dependencies',
        'check-package-dependencies/require-pinned-versions: dependencies > semver: Unexpected range value: expecting "^6.0.0" to be exact "6.3.1"',
      ],
    });
    assert.equal(process.exitCode, 1);
  });
});
