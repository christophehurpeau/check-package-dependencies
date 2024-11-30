import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCreateReportErrorCall,
  assertNoMessages,
  assertSeveralMessages,
  createMockReportError,
} from "../utils/createReportError.testUtils.ts";
import { checkResolutionsVersionsMatch } from "./checkResolutionsVersionsMatch.ts";

describe("checkResolutionsVersionsMatch", () => {
  const { createReportError, messages } = createMockReportError();

  it('should return no error when no "resolutions" is present', () => {
    checkResolutionsVersionsMatch(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      { customCreateReportError: createReportError },
    );
    assertCreateReportErrorCall(
      createReportError,
      "Resolutions match other dependencies",
      "path",
    );
    assertNoMessages(messages);
  });

  it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
    checkResolutionsVersionsMatch(
      { name: "test", resolutions: { test: "1.0.0" } },
      "path",
      { customCreateReportError: createReportError },
    );
    assertCreateReportErrorCall(
      createReportError,
      "Resolutions match other dependencies",
      "path",
    );
    assertNoMessages(messages);
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
    assertCreateReportErrorCall(
      createReportError,
      "Resolutions match other dependencies",
      "path",
    );
    assertNoMessages(messages);
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
    assertCreateReportErrorCall(
      createReportError,
      "Resolutions match other dependencies",
      "path",
    );
    assertSeveralMessages(messages, [
      {
        title: 'Invalid "1.1.0"',
        info: 'expecting "1.1.0" be "1.0.0" from resolutions',
        dependency: { name: "test1", origin: "devDependencies" },
        autoFixable: true,
      },
      {
        title: 'Invalid "1.2.0"',
        info: 'expecting "1.2.0" be "1.0.0" from resolutions',
        dependency: { name: "test2", origin: "dependencies" },
        autoFixable: true,
      },
      {
        title: 'Invalid "1.0.0"',
        info: 'expecting "1.0.0" be "1.1.0" from resolutions',
        dependency: { name: "test3", origin: "dependencies" },
        autoFixable: true,
      },
      {
        title: 'Invalid "1.2.0"',
        info: 'expecting "1.2.0" be "1.1.0" from resolutions',
        dependency: { name: "test4", origin: "dependencies" },
        autoFixable: true,
      },
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
    assertCreateReportErrorCall(
      createReportError,
      "Resolutions match other dependencies",
      "path",
    );
    assertNoMessages(messages);
    assert.equal(pkg.devDependencies.test1, "1.0.0");
    assert.equal(pkg.dependencies.test2, "1.0.0");
  });
});
