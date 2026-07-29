import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import {
  checkMissingSatisfiesVersions,
  checkSatisfiesVersion,
} from "./checkSatisfiesVersions.ts";

describe("checkSatisfiesVersion", () => {
  const { mockReportError, messages } = createMockReportError();

  const check = (value: string, range: string): void => {
    const parsedPkg = parsePkgValue({
      name: "test",
      devDependencies: { test: value },
    });
    checkSatisfiesVersion(
      mockReportError,
      parsedPkg.devDependencies!.test!,
      range,
    );
  };

  it("should return no error when the range is satisfied", () => {
    check("1.0.0", "^1.0.0");
    assertNoMessages(messages);
  });

  it('should return no error when the version is "workspace:*"', () => {
    check("workspace:*", "^2.0.0");
    assertNoMessages(messages);
  });

  it("should return an error when the range is not satisfied", () => {
    check("1.0.0", "^2.0.0");
    assertSingleMessage(messages, {
      errorMessage: "Invalid",
      errorDetails: '"1.0.0" should satisfies "^2.0.0"',
      dependency: {
        name: "test",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
      onlyWarns: undefined,
    });
  });
});

describe("checkMissingSatisfiesVersions", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should return no error when the dependency is declared", () => {
    checkMissingSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }),
      "devDependencies",
      { test: "^1.0.0" },
    );
    assertNoMessages(messages);
  });

  it("should return an error when the dependency is missing", () => {
    checkMissingSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test2: "1.0.0" } }),
      "devDependencies",
      { test: "^1.0.0" },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Missing "test" in "devDependencies"',
      errorDetails: 'should satisfies "^1.0.0"',
      dependency: { name: "test", fieldName: "devDependencies" },
      onlyWarns: undefined,
    });
  });

  it("should accept the dependency in any of the accepted types", () => {
    checkMissingSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }),
      ["devDependencies", "dependencies"],
      { test: "^1.0.0" },
    );
    assertNoMessages(messages);
  });

  it("should report several accepted types without a field name", () => {
    checkMissingSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test" }),
      ["devDependencies", "dependencies"],
      { test: "^1.0.0" },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Missing "test" in "devDependencies" or "dependencies"',
      errorDetails: 'should satisfies "^1.0.0"',
      dependency: { name: "test" },
      onlyWarns: undefined,
    });
  });
});
