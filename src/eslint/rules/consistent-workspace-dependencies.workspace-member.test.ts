import { deepEqual } from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { before, describe, it } from "node:test";
import eslintPlugin from "../../eslint-plugin.ts";

const fixtureDirectoryPath = path.join(
  process.cwd(),
  "fixtures/workspace-member-peer-dependencies",
);

before(() => {
  execSync(
    "yarn install --frozen-lockfile --cache-folder /tmp/yarn-cache-member-peer",
    { cwd: fixtureDirectoryPath },
  );
});

const lintPackageJson = async (
  packageJsonPath: string,
  cwd: string,
): Promise<string[]> => {
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({
    cwd,
    ignore: false,
    overrideConfigFile: true,
    plugins: { "check-package-dependencies-test": eslintPlugin },
    overrideConfig: {
      files: ["**/package.json"],
      language: "check-package-dependencies-test/package-json",
      rules: {
        "check-package-dependencies-test/consistent-workspace-dependencies":
          "error",
      },
    },
  });

  const results = await eslint.lintFiles([packageJsonPath]);

  return results.flatMap((result) =>
    result.messages.map((message) => message.message),
  );
};

const lintMember = async (memberDirectoryName: string): Promise<string[]> =>
  lintPackageJson(
    path.join(
      fixtureDirectoryPath,
      "packages",
      memberDirectoryName,
      "package.json",
    ),
    fixtureDirectoryPath,
  );

// the fixture root declares "eslint": "7.32.0" in devDependencies, which is where a
// workspace member gets the peer dependencies of its own dependencies from
describe("consistent-workspace-dependencies on a workspace member", () => {
  it("should report a peer dependency of a dependency not satisfied by the root", async () => {
    // "eslint-plugin-es-x" requires "eslint": ">=8", "@eslint-community/eslint-utils"
    // requires "eslint": "^6.0.0 || ^7.0.0 || >=8.0.0" and is satisfied
    deepEqual(await lintMember("a"), [
      'devDependencies > eslint: Invalid peer dependency version: "7.32.0" should satisfies ">=8" from "eslint-plugin-es-x" in "dependencies"',
    ]);
  });

  it("should not report a peer dependency the member declares itself", async () => {
    // member "b" declares "eslint": ">=8" in its own peerDependencies, which
    // require-direct-peer-dependencies checks on the member itself
    deepEqual(await lintMember("b"), []);
  });

  it("should not report a dependency the root has in devDependencies", async () => {
    // member "c" depends on "eslint", already checked against the root, and on
    // "semver", which has no peer dependency
    deepEqual(await lintMember("c"), []);
  });

  it("should report nothing for a package that is not in a workspace", async () => {
    const standaloneDirectoryPath = path.join(
      process.cwd(),
      "fixtures/standalone-package",
    );
    deepEqual(
      await lintPackageJson(
        path.join(standaloneDirectoryPath, "package.json"),
        standaloneDirectoryPath,
      ),
      [],
    );
  });
});
