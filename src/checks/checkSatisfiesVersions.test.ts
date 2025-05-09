import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { checkSatisfiesVersions } from "./checkSatisfiesVersions.ts";

describe("checkSatisfiesVersions", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should return no error when range is satisfied", () => {
    checkSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }),
      "devDependencies",
      { test: "^1.0.0" },
    );
    assertNoMessages(messages);
  });

  it("should return error when version not satisfied", () => {
    checkSatisfiesVersions(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }),
      "devDependencies",
      { test: "^2.0.0" },
    );
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

  it("should return error when dependency is missing", () => {
    checkSatisfiesVersions(
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
});
