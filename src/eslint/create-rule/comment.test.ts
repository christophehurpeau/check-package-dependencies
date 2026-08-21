import { deepEqual } from "node:assert/strict";
import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import checkPackagePlugin from "../../eslint-plugin.ts";
import { requirePinnedVersionsRule } from "../rules/require-pinned-versions.ts";
import { satisfiesVersionsRule } from "../rules/satisfies-versions.ts";

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

describe("comment option", () => {
  it("should append the rule comment to a reported error", () => {
    tester.run(
      "require-pinned-versions",
      requirePinnedVersionsRule["require-pinned-versions"]!,
      {
        valid: [],
        invalid: [
          {
            code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "^1.0.0"\n  }\n}\n',
            filename: "/tmp/package.json",
            options: [{ comment: "renovate updates them for us" }],
            errors: [
              {
                message:
                  'devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact (renovate updates them for us)',
              },
            ],
          },
        ],
      },
    );
  });

  it("should append the rule comment to a downgraded warning", () => {
    const warnings = captureWarnings(() => {
      tester.run(
        "require-pinned-versions",
        requirePinnedVersionsRule["require-pinned-versions"]!,
        {
          valid: [
            {
              code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "^1.0.0"\n  }\n}\n',
              filename: "/tmp/package.json",
              options: [{ comment: "not pinned yet", onlyWarnsFor: ["dep"] }],
            },
          ],
          invalid: [],
        },
      );
    });

    deepEqual(warnings, [
      '[warn] /tmp/package.json:4:12 devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" (not pinned yet) - require-pinned-versions',
    ]);
  });

  it("should prefer the comment of the entry over the one of the rule", () => {
    tester.run(
      "satisfies-versions",
      satisfiesVersionsRule["satisfies-versions"]!,
      {
        valid: [],
        invalid: [
          {
            code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "1.0.0"\n  }\n}\n',
            filename: "/tmp/package.json",
            options: [
              {
                comment: "ranges decided by the platform team",
                devDependencies: {
                  dep: { range: "^2.0.0", comment: "2.x fixes a data loss" },
                },
              },
            ],
            errors: [
              {
                message:
                  'devDependencies > dep: Invalid: "1.0.0" should satisfies "^2.0.0" (2.x fixes a data loss)',
              },
            ],
          },
        ],
      },
    );
  });

  it("should append the comment of an onlyWarnsFor entry", () => {
    const warnings = captureWarnings(() => {
      tester.run(
        "require-pinned-versions",
        requirePinnedVersionsRule["require-pinned-versions"]!,
        {
          valid: [
            {
              code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "^1.0.0"\n  }\n}\n',
              filename: "/tmp/package.json",
              options: [
                {
                  onlyWarnsFor: [
                    { name: "dep", comment: "pinning it breaks the build" },
                  ],
                },
              ],
            },
          ],
          invalid: [],
        },
      );
    });

    deepEqual(warnings, [
      '[warn] /tmp/package.json:4:12 devDependencies > dep: Unexpected range value: expecting "^1.0.0" to be exact "1.0.0" (pinning it breaks the build) - require-pinned-versions',
    ]);
  });

  it("should report an unused onlyWarnsFor entry with its comment", () => {
    tester.run(
      "require-pinned-versions",
      requirePinnedVersionsRule["require-pinned-versions"]!,
      {
        valid: [],
        invalid: [
          {
            code: '{\n  "name": "test",\n  "devDependencies": {\n    "dep": "1.0.0"\n  }\n}\n',
            filename: "/tmp/package.json",
            options: [
              {
                onlyWarnsFor: [
                  { name: "other", comment: "waiting for the v2 migration" },
                ],
              },
            ],
            errors: [
              {
                message:
                  'onlyWarnsFor: no warning was raised for "other" (waiting for the v2 migration). You should remove it or check if it is correct.',
              },
            ],
          },
        ],
      },
    );
  });
});
