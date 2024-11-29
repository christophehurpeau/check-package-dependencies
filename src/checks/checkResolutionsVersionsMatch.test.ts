import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import { checkResolutionsVersionsMatch } from "./checkResolutionsVersionsMatch.ts";

describe("checkResolutionsVersionsMatch", () => {
  const { mockReportError, createReportError } = createMockReportError();

  it('should return no error when no "resolutions" is present', () => {
    checkResolutionsVersionsMatch(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
    checkResolutionsVersionsMatch(
      { name: "test", resolutions: { test: "1.0.0" } },
      "path",
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it('should return no error when "resolutions" has dependency matching', () => {
    checkResolutionsVersionsMatch(
      {
        name: "test",
        resolutions: {
          test1: "1.0.0",
          test2: "1.0.0",
          test3: "1.0.1",
          "test4@npm:1.1.0": "patch:1.2.0",
        },
        devDependencies: { test1: "1.0.0", test4: "1.1.0" },
        dependencies: { test2: "1.0.0", test3: "^1.0.0" },
      },
      "path",
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should return error when multiple dependencies not matching", () => {
    checkResolutionsVersionsMatch(
      {
        name: "test",
        resolutions: {
          test1: "1.0.0",
          test2: "1.0.0",
          "test3@npm:1.1.0": "patch:1.2.0",
          "test4@npm:1.1.0": "patch:1.2.0",
        },
        devDependencies: { test1: "1.1.0" },
        dependencies: { test2: "1.2.0", test3: "1.0.0", test4: "1.2.0" },
      },
      "path",
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 4);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "test1" in devDependencies',
      'expecting "1.1.0" be "1.0.0" from resolutions.',
      false,
      true,
    ]);
    assert.deepEqual(mockReportError.mock.calls[1].arguments, [
      'Invalid "test2" in dependencies',
      'expecting "1.2.0" be "1.0.0" from resolutions.',
      false,
      true,
    ]);
    assert.deepEqual(mockReportError.mock.calls[2].arguments, [
      'Invalid "test3" in dependencies',
      'expecting "1.0.0" be "1.1.0" from resolutions.',
      false,
      true,
    ]);
    assert.deepEqual(mockReportError.mock.calls[3].arguments, [
      'Invalid "test4" in dependencies',
      'expecting "1.2.0" be "1.1.0" from resolutions.',
      false,
      true,
    ]);
  });

  it('should fix without error when "resolutions" has dependency not matching', () => {
    const pkg = {
      name: "test",
      resolutions: { test1: "1.0.0", test2: "1.0.0" },
      devDependencies: { test1: "1.1.0" },
      dependencies: { test2: "1.2.0" },
    };
    checkResolutionsVersionsMatch(pkg, "path", {
      customCreateReportError: createReportError,
      tryToAutoFix: true,
    });

    assert.equal(mockReportError.mock.calls.length, 0);
    assert.equal(pkg.devDependencies.test1, "1.0.0");
    assert.equal(pkg.dependencies.test2, "1.0.0");
  });
});
