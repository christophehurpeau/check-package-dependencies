import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkSatisfiesVersionsInDependency } from "./checkSatisfiesVersionsInDependency.ts";

describe(checkSatisfiesVersionsInDependency.name, () => {
  const mockReportError = vi.fn();
  const createReportError = vi.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });
  it("should return no error when no ranges is set", () => {
    checkSatisfiesVersionsInDependency(
      "path",
      { name: "test" },
      {},
      { customCreateReportError: createReportError },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  describe("expect no error", () => {
    it.each([
      ["test1", "devDependencies", "not set", null, {}],
      ["test2", "dependencies", "not set", null, {}],
      ["test3", "resolutions", "not set", null, {}],
      [
        "test1",
        "devDependencies",
        "not present",
        null,
        { devDependencies: { other: "1.0.0" } },
      ],
      [
        "test2",
        "dependencies",
        "not present",
        null,
        { dependencies: { other: "1.0.0" } },
      ],
      [
        "test3",
        "resolutions",
        "not present",
        null,
        { resolutions: { other: "1.0.0" } },
      ],
      [
        "test3",
        "dependencies",
        "present in another type (devDependencies)",
        null,
        { devDependencies: { test3: "1.0.0" } },
      ],
      [
        "test3",
        "dependencies",
        "identical",
        "1.0.0",
        { dependencies: { test3: "1.0.0" } },
      ],
      [
        "test3",
        "dependencies",
        "satisfies (exact)",
        "^1.0.0",
        { dependencies: { test3: "1.1.0" } },
      ],
      [
        "test3",
        "dependencies",
        "satisfies (range)",
        "^1.0.0",
        { dependencies: { test3: "^1.1.0" } },
      ],
    ])(
      "should return no error when %s in %s is %s",
      (depName, depType, _, depValue, pkgContent) => {
        checkSatisfiesVersionsInDependency(
          "path",
          { name: "test", ...pkgContent },
          { [depType]: { [depName]: depValue } },
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).not.toHaveBeenCalled();
      },
    );
  });

  describe("expect error when not dependency is not expected", () => {
    it.each([
      [
        "test1",
        "devDependencies",
        { devDependencies: { test1: "1.0.0" } },
        'Invalid "test1" in devDependencies of "test"',
        "it should not be present",
      ],
      [
        "test2",
        "dependencies",
        { dependencies: { test2: "^1.0.0" } },
        'Invalid "test2" in dependencies of "test"',
        "it should not be present",
      ],
      [
        "test3",
        "resolutions",
        { resolutions: { test3: "1.x" } },
        'Invalid "test3" in resolutions of "test"',
        "it should not be present",
      ],
    ])(
      "should error when %s is not expected in %s",
      (depName, depType, pkgContent, errorTitle, errorInfo) => {
        checkSatisfiesVersionsInDependency(
          "path",
          { name: "test", ...pkgContent },
          { [depType]: { [depName]: null } },
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).toHaveBeenCalledWith(errorTitle, errorInfo);
      },
    );
  });

  describe("expect error when dependency is expected", () => {
    it.each([
      [
        "test1",
        "missing",
        "devDependencies",
        "1.0.0",
        {},
        'Missing "test1" in devDependencies of "test"',
        '"devDependencies" is missing in "test"',
      ],
      [
        "test2",
        "missing",
        "devDependencies",
        "1.0.0",
        { dependencies: {} },
        'Missing "test2" in devDependencies of "test"',
        '"devDependencies" is missing in "test"',
      ],
      [
        "test3",
        "missing",
        "dependencies",
        "^1.0.0",
        { dependencies: { test2: "^1.0.0" } },
        'Missing "test3" in dependencies of "test"',
        '"test3" is missing in dependencies',
      ],
      [
        "test4",
        "invalid",
        "dependencies",
        "^1.0.0",
        { dependencies: { test4: "0.1.0" } },
        'Invalid "test4" in dependencies of "test"',
        '"0.1.0" does not satisfies "^1.0.0"',
      ],
    ])(
      "should error when %s is %s in %s",
      (depName, _, depType, depRange, pkgContent, errorTitle, errorInfo) => {
        checkSatisfiesVersionsInDependency(
          "path",
          { name: "test", ...pkgContent },
          { [depType]: { [depName]: depRange } },
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).toHaveBeenCalledWith(errorTitle, errorInfo);
      },
    );
  });
});
