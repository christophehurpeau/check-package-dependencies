import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkExactVersions } from "./checkExactVersions.ts";

const onlyWarnsForConfigName = "checkExactVersions.test.onlyWarnsFor";
const emptyOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
  onlyWarnsForConfigName,
  [],
);

describe("checkExactVersions", () => {
  const { mockReportError, createReportError } = createMockReportError();

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
    assert.equal(createReportError.mock.calls.length, 1);
    assert.deepEqual(createReportError.mock.calls[0].arguments, [
      "Exact versions",
      "path",
    ]);
    assert.equal(mockReportError.mock.calls.length, 0);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      false,
      false,
    ]);
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
      assert.ok(createReportError.mock.calls.length > 0);
      assert.equal(mockReportError.mock.calls.length, 1);
      assert.deepEqual(mockReportError.mock.calls[0].arguments, [
        'Unexpected range dependency in "devDependencies" for "test"',
        `expecting "${comparator}1.0.0" to be exact "1.0.0".`,
        false,
        false,
      ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      true,
      false,
    ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 4);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    ]);
    assert.deepEqual(mockReportError.mock.calls[1].arguments, [
      'Unexpected range dependency in "devDependencies" for "test2"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    ]);
    assert.deepEqual(mockReportError.mock.calls[2].arguments, [
      'Unexpected range dependency in "devDependencies" for "test3"',
      'expecting "^18" to be exact "18.0.0".',
      false,
      false,
    ]);
    assert.deepEqual(mockReportError.mock.calls[3].arguments, [
      'Unexpected range dependency in "devDependencies" for "test4"',
      'expecting "^18.1" to be exact "18.1.0".',
      false,
      false,
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 0);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.ok(getDependencyPackageJsonMock.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed to resolve "test1".',
      false,
      false,
    ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.ok(getDependencyPackageJsonMock.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed as "test1"\'s resolved version is "2.0.0" and doesn\'t satisfies "~1.0.0".',
      false,
      false,
    ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "rollupv1"',
      'expecting "^1.0.1" to be exact "1.0.1".',
      false,
      false,
    ]);
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
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 2);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      true,
      false,
    ]);
    assert.deepEqual(mockReportError.mock.calls[1].arguments, [
      'Unexpected range dependency in "devDependencies" for "test2"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    ]);
  });
  it("should error when onlyWarnsFor is not fully used", async () => {
    await checkExactVersions({ name: "test" }, "path", ["devDependencies"], {
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck(onlyWarnsForConfigName, [
        "testa",
      ]),
      customCreateReportError: createReportError,
    });
    assert.ok(createReportError.mock.calls.length > 0);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid config in "checkExactVersions.test.onlyWarnsFor"',
      'no warning was raised for "testa"',
      false,
    ]);
  });
});
