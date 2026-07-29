import assert from "node:assert/strict";
import path from "node:path";
import { describe, it } from "node:test";
import { Linter } from "eslint";
import { packageJsonLanguageId, pluginNamespace } from "./eslint/language.ts";
import checkPackagePlugin from "./eslint-plugin.ts";

const packageJsonWithRangeDependency = `${JSON.stringify(
  { name: "test", dependencies: { dep: "^1.0.0" } },
  null,
  2,
)}\n`;

const requirePinnedVersions = "require-pinned-versions";

// the config "files" patterns are matched against the current working directory
const packageJsonPath = path.resolve("package.json");
const jsFilePath = path.resolve("index.js");

describe("eslint plugin languages", () => {
  it("declares the plugin namespace", () => {
    assert.equal(checkPackagePlugin.meta.namespace, pluginNamespace);
  });

  it("declares the package.json language on every rule", () => {
    for (const [ruleName, rule] of Object.entries(checkPackagePlugin.rules)) {
      assert.deepEqual(
        rule.meta?.languages,
        [packageJsonLanguageId],
        `rule "${ruleName}" does not declare the package.json language`,
      );
    }
  });

  it("resolves the rules when the plugin is registered under another name", () => {
    const alias = "check-package-dependencies-alias";

    const messages = new Linter().verify(
      packageJsonWithRangeDependency,
      [
        {
          files: ["**/package.json"],
          plugins: { [alias]: checkPackagePlugin },
          language: `${alias}/package-json`,
          settings: { [pluginNamespace]: { library: false } },
          rules: { [`${alias}/${requirePinnedVersions}`]: "error" },
        },
      ],
      packageJsonPath,
    );

    assert.equal(messages.length, 1);
    assert.match(messages[0]!.message, /expecting "\^1\.0\.0" to be exact/);
  });

  it("rejects a rule enabled on another language", () => {
    assert.throws(
      () =>
        new Linter().verify(
          "const a = 1;\n",
          [
            {
              files: ["**/*.js"],
              plugins: { [pluginNamespace]: checkPackagePlugin },
              rules: {
                [`${pluginNamespace}/${requirePinnedVersions}`]: "error",
              },
            },
          ],
          jsFilePath,
        ),
      /do not support the language "js\/js"/,
    );
  });
});
