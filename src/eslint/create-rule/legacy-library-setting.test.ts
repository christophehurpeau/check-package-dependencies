import { deepEqual } from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { legacyIsLibrarySettingMessage } from "../../utils/library.ts";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

const files = {
  "package.json": {
    name: "wd-root",
    private: true,
    workspaces: ["packages/*"],
    devDependencies: { semver: "7.8.5" },
  },
  "packages/member/package.json": {
    name: "member",
    private: true,
    dependencies: { semver: "^7.0.0" },
  },
};

const lintRoot = (
  settings: Record<string, unknown>,
  rules: string[],
): string[] =>
  lintPackageJsonMessages("package.json", files, {
    settings,
    rules: Object.fromEntries(rules.map((rule) => [rule, "error"])),
  }).filter((message) => message === legacyIsLibrarySettingMessage);

describe("legacy isLibrary setting", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report it once, whatever the number of rules enabled", () => {
    deepEqual(
      lintRoot({ isLibrary: true }, [
        "consistent-workspace-dependencies",
        "no-root-workspace-dependencies",
        "require-workspace-protocol",
      ]),
      [legacyIsLibrarySettingMessage],
    );
  });

  it("should report it for a single rule too", () => {
    deepEqual(lintRoot({ isLibrary: false }, ["require-pinned-versions"]), [
      legacyIsLibrarySettingMessage,
    ]);
  });

  it("should not report anything with the renamed setting", () => {
    deepEqual(
      lintRoot({ library: true }, [
        "consistent-workspace-dependencies",
        "require-pinned-versions",
      ]),
      [],
    );
  });
});
