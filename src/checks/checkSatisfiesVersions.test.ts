import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkSatisfiesVersions } from "./checkSatisfiesVersions.ts";

describe("checkSatisfiesVersions", () => {
  const mockReportError = vi.fn();
  const createReportError = vi.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });

  it("should return no error when range is satisfied", () => {
    checkSatisfiesVersions(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      "devDependencies",
      { test: "^1.0.0" },
      undefined,
      { customCreateReportError: createReportError },
    );
    expect(mockReportError).not.toHaveBeenCalled();
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
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Invalid "test" in devDependencies',
      '"1.0.0" (in "test") should satisfies "^2.0.0".',
      undefined,
    );
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
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Missing "test" in devDependencies',
      'should satisfies "^1.0.0".',
      undefined,
    );
  });
});
