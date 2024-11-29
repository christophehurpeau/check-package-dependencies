import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { checkMinRangeSatisfies } from "./checkMinRangeSatisfies.ts";

describe(checkMinRangeSatisfies.name, () => {
  const { mockReportError, createReportError } = createMockReportError();

  it("should return no error when no dependencies is set", () => {
    checkMinRangeSatisfies("path", { name: "test" });
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  describe("expect no error", () => {
    const testCases: [string, Omit<PackageJson, "name">][] = [
      [
        "exact dev dependency and exact dependency",
        {
          dependencies: { test1: "1.1.0" },
          devDependencies: { test1: "1.1.0" },
        },
      ],
      [
        "exact dev dependency and caret range dependency",
        {
          dependencies: { test1: "^1.1.0" },
          devDependencies: { test1: "1.1.0" },
        },
      ],
      [
        "exact dev dependency and tilde range dependency",
        {
          dependencies: { test1: "~1.1.0" },
          devDependencies: { test1: "1.1.0" },
        },
      ],
      [
        "exact dev dependency and >= range dependency",
        {
          dependencies: { test1: ">=1.1.0" },
          devDependencies: { test1: "1.1.0" },
        },
      ],
      [
        "caret range dev dependency and >= range dependency",
        {
          dependencies: { test1: ">=1.1.0" },
          devDependencies: { test1: "^1.1.0" },
        },
      ],
      [
        "* dependency",
        {
          dependencies: { test1: "*" },
          devDependencies: { test1: "^1.1.0" },
        },
      ],
    ];

    for (const [description, pkgContent] of testCases) {
      it(`should have no error when ${description}`, () => {
        checkMinRangeSatisfies(
          "path",
          { name: "test", ...pkgContent },
          "dependencies",
          "devDependencies",
          { customCreateReportError: createReportError },
        );
        assert.equal(mockReportError.mock.calls.length, 0);
      });
    }
  });

  describe("expect error when not dependency is invalid", () => {
    const testCases: [
      string,
      Omit<PackageJson, "name">,
      string,
      string,
      Omit<PackageJson, "name"> | undefined,
    ][] = [
      [
        "exact dev dependency is higher than exact dependency",
        {
          dependencies: { test1: "1.1.0" },
          devDependencies: { test1: "1.0.0" },
        },
        'Invalid "test1" in dependencies',
        '"1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: "1.0.0" },
        },
      ],
      [
        "exact dev dependency is higher than caret range dependency",
        {
          dependencies: { test1: "^1.0.0" },
          devDependencies: { test1: "1.1.0" },
        },
        'Invalid "test1" in dependencies',
        '"^1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: "^1.1.0" },
        },
      ],
      [
        "exact dev dependency is lower than caret range dependency",
        {
          dependencies: { test1: "^1.1.0" },
          devDependencies: { test1: "1.0.0" },
        },
        'Invalid "test1" in dependencies',
        '"^1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: "^1.0.0" },
        },
      ],
      [
        "exact dev dependency is higher than tilde range dependency",
        {
          dependencies: { test1: "~1.0.0" },
          devDependencies: { test1: "1.1.0" },
        },
        'Invalid "test1" in dependencies',
        '"~1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: "~1.1.0" },
        },
      ],
      [
        "exact dev dependency is lower than tilde range dependency",
        {
          dependencies: { test1: "~1.1.0" },
          devDependencies: { test1: "1.0.0" },
        },
        'Invalid "test1" in dependencies',
        '"~1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: "~1.0.0" },
        },
      ],
      [
        "exact dev dependency is higher than >= range dependency",
        {
          dependencies: { test1: ">=1.0.0" },
          devDependencies: { test1: "1.1.0" },
        },
        'Invalid "test1" in dependencies',
        '">=1.0.0" should satisfies "1.1.0" from "devDependencies".',
        {
          dependencies: { test1: ">=1.1.0" },
        },
      ],
      [
        "exact dev dependency is lower than >= range dependency",
        {
          dependencies: { test1: ">=1.1.0" },
          devDependencies: { test1: "1.0.0" },
        },
        'Invalid "test1" in dependencies',
        '">=1.1.0" should satisfies "1.0.0" from "devDependencies".',
        {
          dependencies: { test1: ">=1.0.0" },
        },
      ],
    ];

    for (const [
      description,
      pkgContent,
      errorTitle,
      errorInfo,
      expectedFix,
    ] of testCases) {
      it(`should error when ${description}`, () => {
        checkMinRangeSatisfies(
          "path",
          { name: "test", ...pkgContent },
          "dependencies",
          "devDependencies",
          { customCreateReportError: createReportError },
        );
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
          errorTitle,
          errorInfo,
          false,
          true,
        ]);

        if (expectedFix) {
          const pkg = JSON.parse(
            JSON.stringify({ name: "test", ...pkgContent }),
          ) as PackageJson;
          checkMinRangeSatisfies(
            "path",
            pkg,
            "dependencies",
            "devDependencies",
            { tryToAutoFix: true },
          );

          assert.deepEqual(pkg, { ...pkg, ...expectedFix });
        }
      });
    }
  });
});
