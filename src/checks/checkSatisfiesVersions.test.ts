import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import { checkSatisfiesVersions } from "./checkSatisfiesVersions.ts";

describe("checkSatisfiesVersions", () => {
  const { mockReportError, createReportError } = createMockReportError();

  it("should return no error when range is satisfied", () => {
    checkSatisfiesVersions(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      "devDependencies",
      { test: "^1.0.0" },
      undefined,
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should return error when version not satisfied", () => {
    checkSatisfiesVersions(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      "devDependencies",
      { test: "^2.0.0" },
      undefined,
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "test" in devDependencies',
      '"1.0.0" (in "test") should satisfies "^2.0.0".',
      undefined,
    ]);
  });

  it("should return error when dependency is missing", () => {
    checkSatisfiesVersions(
      { name: "test", devDependencies: { test2: "1.0.0" } },
      "path",
      "devDependencies",
      { test: "^1.0.0" },
      undefined,
      { customCreateReportError: createReportError },
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Missing "test" in devDependencies',
      'should satisfies "^1.0.0".',
      undefined,
    ]);
  });
});
