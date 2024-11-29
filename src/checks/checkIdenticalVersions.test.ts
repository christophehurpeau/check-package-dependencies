import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import { checkIdenticalVersions } from "./checkIdenticalVersions.ts";

describe("checkIdenticalVersions", () => {
  const { mockReportError, createReportError } = createMockReportError();

  describe("devDependencies in array", () => {
    it("should return no error when all versions are identical", () => {
      checkIdenticalVersions(
        {
          name: "test",
          devDependencies: { react: "1.0.0", "react-dom": "1.0.0" },
        },
        "path",
        "devDependencies",
        {
          react: ["react-dom"],
        },
        undefined,
        createReportError,
      );
      assert.equal(createReportError.mock.calls.length, 1);
      assert.deepEqual(createReportError.mock.calls[0].arguments, [
        "Identical Versions",
        "path",
      ]);
      assert.equal(mockReportError.mock.calls.length, 0);
    });

    it("should return error when versions are not identical", () => {
      checkIdenticalVersions(
        {
          name: "test",
          devDependencies: { react: "1.0.0", "react-dom": "1.0.1" },
        },
        "path",
        "devDependencies",
        {
          react: ["react-dom"],
        },
        undefined,
        createReportError,
      );
      assert.equal(createReportError.mock.calls.length, 1);
      assert.deepEqual(createReportError.mock.calls[0].arguments, [
        "Identical Versions",
        "path",
      ]);
      assert.equal(mockReportError.mock.calls.length, 1);
      assert.deepEqual(mockReportError.mock.calls[0].arguments, [
        'Invalid "react-dom" in devDependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      ]);
    });
  });

  describe("object with dependencies and devDependencies", () => {
    it("should return no error when all versions are identical", () => {
      checkIdenticalVersions(
        {
          name: "test",
          dependencies: { react: "1.0.0", "react-dom": "1.0.0" },
          devDependencies: { "react-test-renderer": "1.0.0" },
        },
        "path",
        "dependencies",
        {
          react: {
            dependencies: ["react-dom"],
            devDependencies: ["react-test-renderer"],
          },
        },
        undefined,
        createReportError,
      );
      assert.equal(createReportError.mock.calls.length, 1);
      assert.deepEqual(createReportError.mock.calls[0].arguments, [
        "Identical Versions",
        "path",
      ]);
      assert.equal(mockReportError.mock.calls.length, 0);
    });

    it("should return error when versions are not identical", () => {
      checkIdenticalVersions(
        {
          name: "test",
          dependencies: { react: "1.0.0", "react-dom": "1.0.1" },
          devDependencies: { "react-test-renderer": "1.0.1" },
        },
        "path",
        "dependencies",
        {
          react: {
            dependencies: ["react-dom"],
            devDependencies: ["react-test-renderer"],
          },
        },
        undefined,
        createReportError,
      );
      assert.equal(createReportError.mock.calls.length, 1);
      assert.deepEqual(createReportError.mock.calls[0].arguments, [
        "Identical Versions",
        "path",
      ]);
      assert.equal(mockReportError.mock.calls.length, 2);
      assert.deepEqual(mockReportError.mock.calls[0].arguments, [
        'Invalid "react-dom" in dependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      ]);
      assert.deepEqual(mockReportError.mock.calls[1].arguments, [
        'Invalid "react-test-renderer" in devDependencies',
        'expecting "1.0.1" be "1.0.0".',
        undefined,
      ]);
    });
  });
});
