import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  assertDeepEqualIgnoringPrototypes,
  assertNoMessages,
  assertSeveralMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkExactVersions } from "./checkExactVersions.ts";

const onlyWarnsForConfigName = "checkExactVersions.test.onlyWarnsFor";
const emptyOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
  onlyWarnsForConfigName,
  [],
);

describe("checkExactVersions", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should return no error when all versions are exact", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          test: "1.0.0",
        },
      }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      },
    );
    assertNoMessages(messages);
  });

  it("should return an error when one version has a caret range", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "^1.0.0" } }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      },
    );
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "^1.0.0" to be exact "1.0.0"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test",
        fieldName: "devDependencies",
        value: "^1.0.0",
      },
      onlyWarns: false,
    });
  });

  for (const comparator of ["<", "<=", ">", ">="]) {
    it(`should return an error when one version has a comparator "${comparator}" range`, () => {
      checkExactVersions(
        mockReportError,
        parsePkgValue({
          name: "test",
          devDependencies: { test: `${comparator}1.0.0` },
        }),
        ["devDependencies"],
        {
          onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        },
      );
      assertSingleMessage(messages, {
        errorMessage: "Unexpected range value",
        errorDetails: `expecting "${comparator}1.0.0" to be exact "1.0.0"`,
        errorTarget: "dependencyValue",
        dependency: {
          name: "test",
          fieldName: "devDependencies",
          value: `${comparator}1.0.0`,
        },
        onlyWarns: false,
      });
    });
  }

  it("should return an warning when one version has a caret range and is in onlyWarnsFor", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "^1.0.0" } }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ["test"],
        ),
      },
    );
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "^1.0.0" to be exact "1.0.0"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test",
        fieldName: "devDependencies",
        value: "^1.0.0",
      },
      onlyWarns: true,
    });
  });

  it("should return an error when one version has a tilde range", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "~1.0.0" } }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      },
    );
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
    });
  });

  it("should return multiple errors when multiple versions have range", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          test1: "~1.0.0",
          test2: "~1.0.0",
          test3: "^18",
          test4: "^18.1",
        },
      }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      },
    );
    assertSeveralMessages(messages, [
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test1",
          fieldName: "devDependencies",
          value: "~1.0.0",
        },
        onlyWarns: false,
      },
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test2",
          fieldName: "devDependencies",
          value: "~1.0.0",
        },
        onlyWarns: false,
      },
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "^18" to be exact "18.0.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test3",
          fieldName: "devDependencies",
          value: "^18",
        },
        onlyWarns: false,
      },
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "^18.1" to be exact "18.1.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test4",
          fieldName: "devDependencies",
          value: "^18.1",
        },
        onlyWarns: false,
      },
    ]);
  });

  it("should fix and remove range", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => [
        {
          name: "test1",
          version: "1.0.1",
        },
        "",
      ],
    );
    const pkg = parsePkgValue({
      name: "test",
      devDependencies: { test1: "~1.0.0" },
    });
    checkExactVersions(mockReportError, pkg, ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    assertNoMessages(messages);
    assert.ok(getDependencyPackageJsonMock.mock.calls.length > 0);
    assertDeepEqualIgnoringPrototypes(pkg.value, {
      name: "test",
      devDependencies: { test1: "1.0.1" },
    });
  });

  it("should error if autofix failed as package does not exists", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => {
        throw new Error("Module not found");
      },
    );
    const pkg = parsePkgValue({
      name: "test",
      devDependencies: { test1: "~1.0.0" },
    });
    checkExactVersions(mockReportError, pkg, ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails:
        'expecting "~1.0.0" to be exact, autofix failed to resolve "test1"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
    });
  });

  it("should error if autofix failed because version doesn't match range", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => [{ name: "test1", version: "2.0.0" }, ""],
    );
    const pkg = parsePkgValue({
      name: "test",
      devDependencies: { test1: "~1.0.0" },
    });
    checkExactVersions(mockReportError, pkg, ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails:
        'expecting "~1.0.0" to be exact, autofix failed as resolved version "2.0.0" doesn\'t satisfy "~1.0.0"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
    });
  });

  it("should support npm: prefix", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollupv1: "npm:rollup@^1.0.1",
        },
      }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      },
    );
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "^1.0.1" to be exact "1.0.1"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "rollupv1",
        fieldName: "devDependencies",
        value: "npm:rollup@^1.0.1",
      },
      onlyWarns: false,
    });
  });

  it("should warn when onlyWarnsFor is passed", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: { test1: "~1.0.0", test2: "~1.0.0" },
      }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ["test1"],
        ),
      },
    );
    assertSeveralMessages(messages, [
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test1",
          fieldName: "devDependencies",
          value: "~1.0.0",
        },
        onlyWarns: true,
      },
      {
        errorMessage: "Unexpected range value",
        errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
        errorTarget: "dependencyValue",
        dependency: {
          name: "test2",
          fieldName: "devDependencies",
          value: "~1.0.0",
        },
        onlyWarns: false,
      },
    ]);
  });

  it("should error when onlyWarnsFor is not fully used", () => {
    checkExactVersions(
      mockReportError,
      parsePkgValue({ name: "test" }),
      ["devDependencies"],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ["testa"],
        ),
      },
    );
    assertSingleMessage(messages, {
      errorMessage: `Invalid config in "${onlyWarnsForConfigName}"`,
      errorDetails: 'no warning was raised for "testa"',
    });
  });
});
