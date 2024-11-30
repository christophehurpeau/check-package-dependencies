import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import {
  assertCreateReportErrorCall,
  assertNoMessages,
  assertSeveralMessages,
  assertSingleMessage,
  createMockReportError,
} from "../utils/createReportError.testUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkExactVersions } from "./checkExactVersions.ts";

const onlyWarnsForConfigName = "checkExactVersions.test.onlyWarnsFor";
const emptyOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
  onlyWarnsForConfigName,
  [],
);

describe("checkExactVersions", () => {
  const { createReportError, messages } = createMockReportError();

  it("should return no error when all versions are exact", async () => {
    await checkExactVersions(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertNoMessages(messages);
  });

  it("should return an error when one version has a caret range", async () => {
    await checkExactVersions(
      { name: "test", devDependencies: { test: "^1.0.0" } },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "^1.0.0" to be exact "1.0.0"',
      dependency: { name: "test", origin: "devDependencies" },
      onlyWarns: false,
    });
  });

  for (const comparator of ["<", "<=", ">", ">="]) {
    it(`should return an error when one version has a comparator "${comparator}" range`, async () => {
      await checkExactVersions(
        { name: "test", devDependencies: { test: `${comparator}1.0.0` } },
        "path",
        ["devDependencies"],
        {
          onlyWarnsForCheck: emptyOnlyWarnsForCheck,
          customCreateReportError: createReportError,
        },
      );
      assertCreateReportErrorCall(createReportError, "Exact versions", "path");
      assertSingleMessage(messages, {
        title: "Unexpected range dependency",
        info: `expecting "${comparator}1.0.0" to be exact "1.0.0"`,
        dependency: { name: "test", origin: "devDependencies" },
        onlyWarns: false,
      });
    });
  }

  it("should return an warning when one version has a caret range and is in onlyWarnsFor", async () => {
    await checkExactVersions(
      { name: "test", devDependencies: { test: "^1.0.0" } },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ["test"],
        ),
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "^1.0.0" to be exact "1.0.0"',
      dependency: { name: "test", origin: "devDependencies" },
      onlyWarns: true,
    });
  });

  it("should return an error when one version has a tilde range", async () => {
    await checkExactVersions(
      { name: "test", devDependencies: { test: "~1.0.0" } },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "~1.0.0" to be exact "1.0.0"',
      dependency: { name: "test", origin: "devDependencies" },
      onlyWarns: false,
    });
  });

  it("should return multiple errors when multiple versions have range", async () => {
    await checkExactVersions(
      {
        name: "test",
        devDependencies: {
          test1: "~1.0.0",
          test2: "~1.0.0",
          test3: "^18",
          test4: "^18.1",
        },
      },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSeveralMessages(messages, [
      {
        title: "Unexpected range dependency",
        info: 'expecting "~1.0.0" to be exact "1.0.0"',
        dependency: { name: "test1", origin: "devDependencies" },
        onlyWarns: false,
      },
      {
        title: "Unexpected range dependency",
        info: 'expecting "~1.0.0" to be exact "1.0.0"',
        dependency: { name: "test2", origin: "devDependencies" },
        onlyWarns: false,
      },
      {
        title: "Unexpected range dependency",
        info: 'expecting "^18" to be exact "18.0.0"',
        dependency: { name: "test3", origin: "devDependencies" },
        onlyWarns: false,
      },
      {
        title: "Unexpected range dependency",
        info: 'expecting "^18.1" to be exact "18.1.0"',
        dependency: { name: "test4", origin: "devDependencies" },
        onlyWarns: false,
      },
    ]);
  });

  it("should fix and remove range", async () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => ({
        name: "test1",
        version: "1.0.1",
      }),
    );
    const pkg = { name: "test", devDependencies: { test1: "~1.0.0" } };
    await checkExactVersions(pkg, "path", ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertNoMessages(messages);
    assert.ok(getDependencyPackageJsonMock.mock.calls.length > 0);
    assert.deepEqual(pkg, {
      name: "test",
      devDependencies: { test1: "1.0.1" },
    });
  });

  it("should error if autofix failed as package does not exists", async () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => {
        throw new Error("Module not found");
      },
    );
    const pkg = { name: "test", devDependencies: { test1: "~1.0.0" } };
    await checkExactVersions(pkg, "path", ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "~1.0.0" to be exact, autofix failed to resolve "test1"',
      dependency: { name: "test1", origin: "devDependencies" },
      onlyWarns: false,
    });
  });

  it("should error if autofix failed because version doesn't match range", async () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => ({ name: "test1", version: "2.0.0" }),
    );
    const pkg = { name: "test", devDependencies: { test1: "~1.0.0" } };
    await checkExactVersions(pkg, "path", ["devDependencies"], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "~1.0.0" to be exact, autofix failed as resolved version "2.0.0" doesn\'t satisfy "~1.0.0"',
      dependency: { name: "test1", origin: "devDependencies" },
      onlyWarns: false,
    });
  });

  it("should support npm: prefix", async () => {
    await checkExactVersions(
      {
        name: "test",
        devDependencies: {
          rollupv1: "npm:rollup@^1.0.1",
        },
      },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: "Unexpected range dependency",
      info: 'expecting "^1.0.1" to be exact "1.0.1"',
      dependency: { name: "rollupv1", origin: "devDependencies" },
      onlyWarns: false,
    });
  });

  it("should warn when onlyWarnsFor is passed", async () => {
    await checkExactVersions(
      { name: "test", devDependencies: { test1: "~1.0.0", test2: "~1.0.0" } },
      "path",
      ["devDependencies"],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ["test1"],
        ),
        customCreateReportError: createReportError,
      },
    );
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSeveralMessages(messages, [
      {
        title: "Unexpected range dependency",
        info: 'expecting "~1.0.0" to be exact "1.0.0"',
        dependency: { name: "test1", origin: "devDependencies" },
        onlyWarns: true,
      },
      {
        title: "Unexpected range dependency",
        info: 'expecting "~1.0.0" to be exact "1.0.0"',
        dependency: { name: "test2", origin: "devDependencies" },
        onlyWarns: false,
      },
    ]);
  });

  it("should error when onlyWarnsFor is not fully used", async () => {
    await checkExactVersions({ name: "test" }, "path", ["devDependencies"], {
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck(onlyWarnsForConfigName, [
        "testa",
      ]),
      customCreateReportError: createReportError,
    });
    assertCreateReportErrorCall(createReportError, "Exact versions", "path");
    assertSingleMessage(messages, {
      title: `Invalid config in "${onlyWarnsForConfigName}"`,
      info: 'no warning was raised for "testa"',
    });
  });
});
