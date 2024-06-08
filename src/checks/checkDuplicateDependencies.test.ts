import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies";

describe("checkDuplicateDependencies", () => {
  const mockReportError = vi.fn();

  beforeEach(() => {
    mockReportError.mockReset();
  });

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
    expect(mockReportError).toHaveBeenCalledWith(
      'Invalid "rollup" present in dependencies and devDependencies',
      "please place it only in dependencies",
    );
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
    expect(mockReportError).toHaveBeenCalledWith(
      'Invalid "rollup" has same version in dependencies and devDependencies',
      "please place it only in dependencies or use range in dependencies",
    );
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
    expect(mockReportError).toHaveBeenCalledWith(
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" dependencies.',
      false,
    );
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
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when dependency value is also a range", () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: "test",
        dependencies: {
          rollup: "^1.0.1",
        },
      },
      false,
      "dependencies",
      ["dependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
