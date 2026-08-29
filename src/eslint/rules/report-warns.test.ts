import assert from "node:assert/strict";
import path from "node:path";
import { afterEach, describe, it, mock } from "node:test";
import type { Linter } from "eslint";
import { lintPackageJson } from "../eslint.testUtils.ts";

const files = {
  "package.json": {
    name: "test",
    devDependencies: { dep: "^1.0.0", other: "^2.0.0" },
  },
};

interface ReportedMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
}

const toReportedMessage = ({
  ruleId,
  severity,
  message,
  line,
  column,
}: Linter.LintMessage): ReportedMessage => ({
  ruleId,
  severity,
  message,
  line,
  column,
});

interface LintResult {
  messages: ReportedMessage[];
  warns: string[];
}

const lint = (rules: Record<string, Linter.RuleEntry>): LintResult => {
  const warn = mock.method(console, "warn", () => undefined);
  const messages = lintPackageJson("package.json", files, { rules });
  return {
    messages: messages.map(toReportedMessage),
    warns: warn.mock.calls.map((call) => String(call.arguments[0])),
  };
};

const downgradedWarn = `[warn] ${path.resolve("package.json")}:4:12 devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" - require-pinned-versions`;

describe("report-warns", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("should report the downgraded error as a warning, at the dependency location", () => {
    const { messages, warns } = lint({
      "require-pinned-versions": ["error", { onlyWarnsFor: ["dep"] }],
      "report-warns": "warn",
    });

    assert.deepEqual(messages, [
      {
        ruleId: "check-package-dependencies/report-warns",
        severity: 1,
        message:
          'devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" - require-pinned-versions',
        line: 4,
        column: 12,
      },
      {
        ruleId: "check-package-dependencies/require-pinned-versions",
        severity: 2,
        message:
          'devDependencies > other: Unexpected range value: expecting "^2.0.0" to be exact',
        line: 5,
        column: 14,
      },
    ]);
    // to be removed with the console.warn of createPackageRule
    assert.deepEqual(warns, [downgradedWarn]);
  });

  it("should report nothing when no error was downgraded", () => {
    const { messages, warns } = lint({
      "require-pinned-versions": ["error", { onlyWarnsFor: [] }],
      "report-warns": "warn",
    });

    assert.deepEqual(
      messages.map((message) => message.ruleId),
      [
        "check-package-dependencies/require-pinned-versions",
        "check-package-dependencies/require-pinned-versions",
      ],
    );
    assert.deepEqual(warns, []);
  });

  it("should only log the downgraded error when the rule is not enabled", () => {
    const { messages, warns } = lint({
      "require-pinned-versions": ["error", { onlyWarnsFor: ["dep"] }],
    });

    assert.deepEqual(
      messages.map((message) => message.ruleId),
      ["check-package-dependencies/require-pinned-versions"],
    );
    assert.deepEqual(warns, [downgradedWarn]);
  });

  it("should report the errors downgraded by every rule", () => {
    const { messages } = lint({
      "require-pinned-versions": ["error", { onlyWarnsFor: ["dep"] }],
      "require-identical-versions": [
        "error",
        { devDependencies: { dep: ["other"] }, onlyWarnsFor: ["dep"] },
      ],
      "report-warns": "warn",
    });

    assert.deepEqual(
      messages
        .filter(
          (message) =>
            message.ruleId === "check-package-dependencies/report-warns",
        )
        .map((message) => message.message),
      [
        'devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" - require-pinned-versions',
        'devDependencies > other: Invalid "other": expecting "^2.0.0" to be "^1.0.0" identical to "dep" in "devDependencies" - require-identical-versions',
      ],
    );
  });
});
