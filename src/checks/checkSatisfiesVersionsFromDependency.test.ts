import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import {
  checkDependencySatisfiesVersionFromDependency,
  checkMissingSatisfiesVersionsFromDependency,
} from "./checkSatisfiesVersionsFromDependency.ts";

const createGetDependencyPackageJson =
  (depPkg: PackageJson): GetDependencyPackageJson =>
  () => [depPkg, "/path/to/node_modules/test-dep/package.json"];

describe("checkMissingSatisfiesVersionsFromDependency", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should return no error when the dependency is declared in the package", () => {
    checkMissingSatisfiesVersionsFromDependency(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test1: "1.0.0" } }),
      {
        dependencies: { "test-dep": { devDependencies: ["test1"] } },
        readRangesFrom: "dependencies",
        getDependencyPackageJson: createGetDependencyPackageJson({
          name: "test-dep",
          dependencies: { test1: "1.0.0" },
        }),
      },
    );

    assertNoMessages(messages);
  });

  it("should error when the dependency is missing in the package", () => {
    checkMissingSatisfiesVersionsFromDependency(
      mockReportError,
      parsePkgValue({ name: "test" }),
      {
        dependencies: { "test-dep": { devDependencies: ["test1"] } },
        readRangesFrom: "dependencies",
        getDependencyPackageJson: createGetDependencyPackageJson({
          name: "test-dep",
          dependencies: { test1: "^1.0.0" },
        }),
      },
    );

    assertSingleMessage(messages, {
      errorMessage: 'Missing "test1" in "devDependencies"',
      errorDetails: 'should satisfies "^1.0.0"',
      dependency: { name: "test1", fieldName: "devDependencies" },
      onlyWarns: undefined,
    });
  });

  it("should read the ranges from the devDependencies of the dependency", () => {
    checkMissingSatisfiesVersionsFromDependency(
      mockReportError,
      parsePkgValue({ name: "test" }),
      {
        dependencies: { "test-dep": { devDependencies: ["test1"] } },
        readRangesFrom: "devDependencies",
        getDependencyPackageJson: createGetDependencyPackageJson({
          name: "test-dep",
          dependencies: { test1: "^1.0.0" },
          devDependencies: { test1: "^2.0.0" },
        }),
      },
    );

    assertSingleMessage(messages, {
      errorMessage: 'Missing "test1" in "devDependencies"',
      errorDetails: 'should satisfies "^2.0.0"',
      dependency: { name: "test1", fieldName: "devDependencies" },
      onlyWarns: undefined,
    });
  });

  it("should throw when the dependency does not declare the configured dependency", () => {
    assert.throws(
      () =>
        checkMissingSatisfiesVersionsFromDependency(
          mockReportError,
          parsePkgValue({ name: "test" }),
          {
            dependencies: { "test-dep": { devDependencies: ["test1"] } },
            readRangesFrom: "dependencies",
            getDependencyPackageJson: createGetDependencyPackageJson({
              name: "test-dep",
            }),
          },
        ),
      { message: 'Dependency "test-dep" has no "test1" in "dependencies"' },
    );
  });
});

describe("checkDependencySatisfiesVersionFromDependency", () => {
  const { mockReportError, messages } = createMockReportError();

  const checkDependencyValue = (
    dependencyType: "devDependencies" | "peerDependencies",
    dependencyValue: string,
    rangeInDependency: string,
  ): void => {
    const parsedPkg = parsePkgValue({
      name: "test",
      [dependencyType]: { test1: dependencyValue },
    });

    checkDependencySatisfiesVersionFromDependency(
      mockReportError,
      parsedPkg[dependencyType]!.test1!,
      {
        dependencies: { "test-dep": { devDependencies: ["test1"] } },
        readRangesFrom: "dependencies",
        getDependencyPackageJson: createGetDependencyPackageJson({
          name: "test-dep",
          dependencies: { test1: rangeInDependency },
        }),
      },
    );
  };

  const satisfyingCases: [description: string, value: string, range: string][] =
    [
      ["is exact", "1.0.0", "1.0.0"],
      ["is range (^) in range (^), when same", "^1.0.0", "^1.0.0"],
      ["is range (^) in range (^), when higher", "^1.0.1", "^1.0.0"],
      ["is workspace:* in the package", "workspace:*", "^1.0.0"],
    ];

  for (const [description, value, range] of satisfyingCases) {
    it(`should return no error when the version ${description}`, () => {
      checkDependencyValue("devDependencies", value, range);
      assertNoMessages(messages);
    });
  }

  it("should error when the version does not satisfy the range", () => {
    checkDependencyValue("devDependencies", "1.0.0", "^2.0.0");

    assertSingleMessage(messages, {
      errorMessage: "Invalid",
      errorDetails: '"1.0.0" should satisfies "^2.0.0"',
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
      onlyWarns: undefined,
    });
  });

  it("should return no error when the dependency is not configured", () => {
    const parsedPkg = parsePkgValue({
      name: "test",
      devDependencies: { otherDep: "1.0.0" },
    });

    checkDependencySatisfiesVersionFromDependency(
      mockReportError,
      parsedPkg.devDependencies!.otherDep!,
      {
        dependencies: { "test-dep": { devDependencies: ["test1"] } },
        readRangesFrom: "dependencies",
        getDependencyPackageJson: createGetDependencyPackageJson({
          name: "test-dep",
          dependencies: { test1: "1.0.0" },
        }),
      },
    );

    assertNoMessages(messages);
  });

  it("should return no error for a field that is not a regular dependency type", () => {
    checkDependencyValue("peerDependencies", "1.0.0", "0.1.0");
    assertNoMessages(messages);
  });
});
