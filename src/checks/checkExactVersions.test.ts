import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue } from "../utils/packageTypes.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkExactVersion } from "./checkExactVersions.ts";

const onlyWarnsForConfigName = "checkExactVersions.test.onlyWarnsFor";
const emptyOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
  onlyWarnsForConfigName,
  [],
);

const dependencyValue = (name: string, value: string): DependencyValue =>
  parsePkgValue({ name: "test", devDependencies: { [name]: value } })
    .devDependencies![name]!;

describe("checkExactVersion", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should return no error when the version is exact", () => {
    checkExactVersion(mockReportError, dependencyValue("test", "1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
    });
    assertNoMessages(messages);
  });

  it("should return an error when the version has a caret range", () => {
    checkExactVersion(mockReportError, dependencyValue("test", "^1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
    });
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

  it("should return an error when the version has a tilde range", () => {
    checkExactVersion(mockReportError, dependencyValue("test", "~1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
    });
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

  for (const comparator of ["<", "<=", ">", ">="]) {
    it(`should return an error when the version has a comparator "${comparator}" range`, () => {
      checkExactVersion(
        mockReportError,
        dependencyValue("test", `${comparator}1.0.0`),
        { onlyWarnsForCheck: emptyOnlyWarnsForCheck },
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

  const partialRanges: [range: string, exactVersion: string][] = [
    ["^18", "18.0.0"],
    ["^18.1", "18.1.0"],
  ];

  for (const [range, exactVersion] of partialRanges) {
    it(`should complete the expected version of the partial range "${range}"`, () => {
      checkExactVersion(mockReportError, dependencyValue("test", range), {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      });
      assertSingleMessage(messages, {
        errorMessage: "Unexpected range value",
        errorDetails: `expecting "${range}" to be exact "${exactVersion}"`,
        errorTarget: "dependencyValue",
        dependency: {
          name: "test",
          fieldName: "devDependencies",
          value: range,
        },
        onlyWarns: false,
      });
    });
  }

  it("should warn instead of erroring when the dependency is in onlyWarnsFor", () => {
    checkExactVersion(mockReportError, dependencyValue("test", "^1.0.0"), {
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck(onlyWarnsForConfigName, [
        "test",
      ]),
    });
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

  it("should support the npm: prefix", () => {
    checkExactVersion(
      mockReportError,
      dependencyValue("rollupv1", "npm:rollup@^1.0.1"),
      { onlyWarnsForCheck: emptyOnlyWarnsForCheck },
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

  it("should fix to the installed version when it satisfies the range", () => {
    const getDependencyPackageJson = mock.fn<GetDependencyPackageJson>(() => [
      { name: "test1", version: "1.0.1" },
      "",
    ]);

    checkExactVersion(mockReportError, dependencyValue("test1", "~1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      getDependencyPackageJson,
    });

    assert.ok(getDependencyPackageJson.mock.calls.length > 0);
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "~1.0.0" to be exact "1.0.1"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
      fixTo: "1.0.1",
    });
  });

  it("should not offer a fix when the dependency cannot be resolved", () => {
    checkExactVersion(mockReportError, dependencyValue("test1", "~1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      getDependencyPackageJson: mock.fn<GetDependencyPackageJson>(() => {
        throw new Error("Module not found");
      }),
    });

    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "~1.0.0" to be exact',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
    });
  });

  it("should not offer a fix when the installed version does not satisfy the range", () => {
    checkExactVersion(mockReportError, dependencyValue("test1", "~1.0.0"), {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      getDependencyPackageJson: mock.fn<GetDependencyPackageJson>(() => [
        { name: "test1", version: "2.0.0" },
        "",
      ]),
    });

    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "~1.0.0" to be exact',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: false,
    });
  });

  it("should not resolve the dependency when it is in onlyWarnsFor", () => {
    const getDependencyPackageJson = mock.fn<GetDependencyPackageJson>(() => [
      { name: "test1", version: "1.0.1" },
      "",
    ]);

    checkExactVersion(mockReportError, dependencyValue("test1", "~1.0.0"), {
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck(onlyWarnsForConfigName, [
        "test1",
      ]),
      getDependencyPackageJson,
    });

    assert.equal(getDependencyPackageJson.mock.calls.length, 0);
    assertSingleMessage(messages, {
      errorMessage: "Unexpected range value",
      errorDetails: 'expecting "~1.0.0" to be exact "1.0.0"',
      errorTarget: "dependencyValue",
      dependency: {
        name: "test1",
        fieldName: "devDependencies",
        value: "~1.0.0",
      },
      onlyWarns: true,
    });
  });
});
