import { deepEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { requirePinnedVersionsRule } from "../rules/require-pinned-versions.ts";

const tester = new RuleTester({
  plugins: checkPackagePlugin.configs.recommended.plugins,
  language: "check-package-dependencies/package-json",
  settings: { "check-package-dependencies": { library: false } },
});

const captureWarnings = (run: () => void): string[] => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]): void => {
    warnings.push(args.join(" "));
  };
  try {
    run();
  } finally {
    console.warn = originalWarn;
  }
  return warnings;
};

describe("onlyWarnsFor warning message", () => {
  it("should include the package.json path and the dependency location", () => {
    const warnings = captureWarnings(() => {
      tester.run(
        "require-pinned-versions",
        requirePinnedVersionsRule["require-pinned-versions"]!,
        {
          valid: [
            {
              code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "^1.0.0"\n  }\n}\n',
              filename: "/tmp/package.json",
              options: [{ onlyWarnsFor: ["dep"] }],
            },
          ],
          invalid: [],
        },
      );
    });

    deepEqual(warnings, [
      '[warn] /tmp/package.json:4:12 devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" - require-pinned-versions',
    ]);
  });
});
