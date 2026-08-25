import assert from "node:assert/strict";
import path from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import { lintPackageJsonMessages } from "../eslint.testUtils.ts";

const files = {
  "package.json": { name: "root", workspaces: ["packages/*"] },
  "packages/a/package.json": { name: "a" },
  "packages/not-a-package/readme.md": "",
};

const expectedMessage = `${path.resolve("package.json")} workspaces: ignored potential directory, no package.json found: packages/not-a-package`;

const lintRoot = (
  settings?: Record<string, unknown>,
): { messages: string[]; warns: string[] } => {
  const warn = mock.method(console, "warn", () => undefined);
  const messages = lintPackageJsonMessages("package.json", files, {
    rules: { "consistent-workspace-dependencies": "error" },
    settings,
  });
  return {
    messages,
    warns: warn.mock.calls.map((call) => String(call.arguments[0])),
  };
};

describe("potentialDirectories setting", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should log a warning by default", () => {
    const { messages, warns } = lintRoot();

    assert.deepEqual(messages, []);
    assert.deepEqual(warns, [`[warn] ${expectedMessage}`]);
  });

  it('should log a warning with "warn"', () => {
    const { messages, warns } = lintRoot({ potentialDirectories: "warn" });

    assert.deepEqual(messages, []);
    assert.deepEqual(warns, [`[warn] ${expectedMessage}`]);
  });

  it('should log nothing with "off"', () => {
    const { messages, warns } = lintRoot({ potentialDirectories: "off" });

    assert.deepEqual(messages, []);
    assert.deepEqual(warns, []);
  });

  it('should report a lint error with "error"', () => {
    const { messages, warns } = lintRoot({ potentialDirectories: "error" });

    assert.deepEqual(messages, [expectedMessage]);
    assert.deepEqual(warns, []);
  });

  it("should report an invalid value and fall back to a warning", () => {
    const { messages, warns } = lintRoot({ potentialDirectories: "disable" });

    assert.deepEqual(messages, [
      'Invalid "potentialDirectories" setting: received "disable", expected "off", "warn" or "error".',
    ]);
    assert.deepEqual(warns, [`[warn] ${expectedMessage}`]);
  });
});
