import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.ts";

describe("checkDuplicateDependencies", () => {
  const { mockReportError } = createMockReportError();

  it("should report error when is in multiple types and not a library", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
        },
        dependencies: {
          rollup: "1.0.0",
        },
      },
      false,
      "dependencies",
      ["dependencies", "devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "rollup" present in dependencies and devDependencies',
      "please place it only in dependencies",
    ]);
  });
  it("should report error when is in multiple types with same version and is a library", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
        },
        dependencies: {
          rollup: "1.0.0",
        },
      },
      true,
      "dependencies",
      ["dependencies", "devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "rollup" has same version in dependencies and devDependencies',
      "please place it only in dependencies or use range in dependencies",
    ]);
  });

  it("should report error when dependency does not intersect", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" dependencies.',
      false,
    ]);
  });

  it("should not report error when dev dependency value is a beta", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0-beta.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0-beta.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when dependency is in onlyWarnsFor", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", ["rollup"]),
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" dependencies.',
      true,
    ]);
  });

  it("should not report error when dependency is in peerDependencies", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      false,
      "peerDependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should report error when dependency is in peerDependencies and allowPeerDependencies is false", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      true,
      "peerDependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" peerDependencies.',
      false,
    ]);
  });
});
