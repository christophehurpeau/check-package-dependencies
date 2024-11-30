import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCreateReportErrorCall,
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../utils/createReportError.testUtils.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { checkSatisfiesVersionsFromDependency } from "./checkSatisfiesVersionsFromDependency.ts";

type DependencyTypes =
  | "dependencies"
  | "devDependencies"
  | "peerDependencies"
  | "resolutions";

describe(checkSatisfiesVersionsFromDependency.name, () => {
  const { createReportError, messages } = createMockReportError();

  it("should return no error when no keys", () => {
    checkSatisfiesVersionsFromDependency(
      { name: "test" },
      "path",
      "dependencies",
      [],
      { name: "depTest", dependencies: {} },
      "dependencies",
      {
        customCreateReportError: createReportError,
        shouldHaveExactVersions: () => false,
      },
    );
    assertCreateReportErrorCall(
      createReportError,
      "Satisfies Versions From Dependency",
      "path",
    );
    assertNoMessages(messages);
  });

  describe("expect no error", () => {
    const testCases: [
      depName: string,
      depTypeInDep: string,
      description: string,
      depValueInDep: string,
      depValueInPkg: string,
    ][] = [
      ["test1", "devDependencies", "is exact", "1.0.0", "1.0.0"],
      ["test2", "devDependencies", "is in range (^)", "1.0.0", "1.0.0"],
      [
        "test3",
        "devDependencies",
        "is range (^) in range (^), when same",
        "^1.0.0",
        "^1.0.0",
      ],
      [
        "test4",
        "devDependencies",
        "is range (^) in range (^), when higher",
        "^1.0.0",
        "^1.0.1",
      ],
      ["test5", "dependencies", "is exact", "1.0.0", "1.0.0"],
      ["test6", "resolutions", "is exact", "1.0.0", "1.0.0"],
    ];

    for (const [
      depName,
      depTypeInDep,
      description,
      depValueInDep,
      depValueInPkg,
    ] of testCases) {
      it(`should return no error when ${depName} in ${depTypeInDep} ${description}`, () => {
        const depTypeInPkg: DependencyTypes = "devDependencies";
        const pkg: PackageJson = {
          name: "test",
          ...(depValueInPkg
            ? { [depTypeInPkg]: { [depName]: depValueInPkg } }
            : {}),
        };

        checkSatisfiesVersionsFromDependency(
          pkg,
          "path",
          depTypeInPkg,
          [depName],
          {
            name: "test-dep",
            [depTypeInDep]: { [depName]: depValueInDep },
          },
          depTypeInDep as DependencyTypes,
          {
            customCreateReportError: createReportError,
            shouldHaveExactVersions: () => false,
          },
        );
        assertCreateReportErrorCall(
          createReportError,
          "Satisfies Versions From Dependency",
          "path",
        );
        assertNoMessages(messages);
      });
    }
  });

  describe("expect to fix", () => {
    const fixTestCases: [
      description: string,
      depValue: string,
      pkgContent: Omit<PackageJson, "name">,
      expectedFix: Omit<PackageJson, "name">,
      shouldHaveExactVersions: boolean,
    ][] = [
      [
        '"devDependencies" missing',
        "1.0.1",
        {},
        { devDependencies: { expectedDep: "1.0.1" } },
        true,
      ],
      [
        "dependency missing",
        "1.0.1",
        { devDependencies: { otherPackage: "1.0.0" } },
        { devDependencies: { otherPackage: "1.0.0", expectedDep: "1.0.1" } },
        true,
      ],
      [
        "invalid version",
        "1.0.1",
        { devDependencies: { expectedDep: "1.0.0" } },
        { devDependencies: { expectedDep: "1.0.1" } },
        true,
      ],
      [
        "expects exact versions with missing version",
        "1.0.1",
        { devDependencies: {} },
        { devDependencies: { expectedDep: "1.0.1" } },
        true,
      ],
      [
        "expects range versions with missing version",
        "^1.0.1",
        { devDependencies: {} },
        { devDependencies: { expectedDep: "^1.0.1" } },
        false,
      ],
      [
        "expects exact version with existing version ; shouldHaveExactVersions = true",
        "^1.0.1",
        { devDependencies: { expectedDep: "1.0.0" } },
        { devDependencies: { expectedDep: "1.0.1" } },
        true,
      ],
      [
        "expects exact version with existing version ; shouldHaveExactVersions = false",
        "^1.0.1",
        { devDependencies: { expectedDep: "1.0.0" } },
        { devDependencies: { expectedDep: "1.0.1" } },
        false,
      ],
      [
        "expects range version with existing version ; shouldHaveExactVersions = true",
        "^1.0.1",
        { devDependencies: { expectedDep: "^1.0.0" } },
        { devDependencies: { expectedDep: "^1.0.1" } },
        true,
      ],
      [
        "expects range version with existing version ; shouldHaveExactVersions = false ; with release",
        "^1.0.1-beta",
        { devDependencies: { expectedDep: "^1.0.0" } },
        { devDependencies: { expectedDep: "^1.0.1-beta" } },
        false,
      ],
    ];

    for (const [
      description,
      depValue,
      pkgContent,
      expectedFix,
      shouldHaveExactVersions,
    ] of fixTestCases) {
      it(`should fix when ${description}`, () => {
        const depTypeInPkg: DependencyTypes = "devDependencies";
        const pkg: PackageJson = {
          name: "test",
          ...pkgContent,
        };

        checkSatisfiesVersionsFromDependency(
          pkg,
          "path",
          depTypeInPkg,
          ["expectedDep"],
          {
            name: "test-dep",
            [depTypeInPkg]: { expectedDep: depValue },
          },
          depTypeInPkg,
          {
            customCreateReportError: createReportError,
            shouldHaveExactVersions: () => shouldHaveExactVersions,
            tryToAutoFix: true,
          },
        );

        assert.deepEqual(pkg, {
          name: "test",
          ...expectedFix,
        });
      });
    }
  });

  describe("expect error when not dependency is not expected", () => {
    const testCases: [
      depName: string,
      depTypeInDep: string,
      description: string,
      depPkgContent: Omit<PackageJson, "name">,
      pkgContent: Omit<PackageJson, "name">,
      errorTitle: string,
      errorInfo: string,
      autoFixable?: boolean,
    ][] = [
      [
        "test1",
        "devDependencies",
        "missing in pkg",
        { devDependencies: { test1: "1.0.0" } },
        {},
        "Missing dependency",
        'should satisfies "1.0.0" from "test-dep" in "devDependencies"',
        true,
      ],
      [
        "test2",
        "devDependencies",
        "dependency missing in pkg dependency",
        { devDependencies: { test2: "1.0.0" } },
        { devDependencies: {} },
        "Missing dependency",
        'should satisfies "1.0.0" from "test-dep" in "devDependencies"',
        true,
      ],
      [
        "test3",
        "devDependencies",
        "devDependencies missing in pkg dependency",
        {},
        { devDependencies: { test3: "1.0.0" } },
        "Unexpected missing dependency",
        'config expects "test3" in "devDependencies" of "test-dep"',
      ],
      [
        "test4",
        "devDependencies",
        "invalid",
        { devDependencies: { test4: "0.1.0" } },
        { devDependencies: { test4: "1.0.0" } },
        "Invalid",
        '"1.0.0" should satisfies "0.1.0" from "test-dep" in "devDependencies"',
        true,
      ],
    ];

    for (const [
      depName,
      depTypeInDep,
      description,
      depPkgContent,
      pkgContent,
      errorTitle,
      errorInfo,
      autoFixable,
    ] of testCases) {
      it(`should error when ${depName} is ${description} in ${depTypeInDep}`, () => {
        const depTypeInPkg: DependencyTypes = "devDependencies";
        const pkg: PackageJson = {
          ...pkgContent,
          name: "test",
        };

        checkSatisfiesVersionsFromDependency(
          pkg,
          "path",
          depTypeInPkg,
          [depName],
          {
            ...depPkgContent,
            name: "test-dep",
          },
          depTypeInDep as DependencyTypes,
          {
            customCreateReportError: createReportError,
            shouldHaveExactVersions: () => false,
          },
        );
        assertCreateReportErrorCall(
          createReportError,
          "Satisfies Versions From Dependency",
          "path",
        );
        assertSingleMessage(messages, {
          title: errorTitle,
          info: errorInfo,
          dependency: { name: depName, origin: depTypeInPkg },
          onlyWarns: undefined,
          autoFixable,
        });
      });
    }
  });
});
