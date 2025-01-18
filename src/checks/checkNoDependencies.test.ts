import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { checkNoDependencies } from "./checkNoDependencies.ts";

describe("checkNoDependencies", () => {
  const { mockReportError, messages } = createMockReportError();

  it('should return no error when no "dependencies" is present', () => {
    checkNoDependencies(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { test: "1.0.0" } }),
    );
    assertNoMessages(messages);
  });

  it('should return no error when no "devDependencies" is present', () => {
    checkNoDependencies(
      mockReportError,
      parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }),
      "devDependencies",
    );
    assertNoMessages(messages);
  });

  it('should return no error when "dependencies" is present', () => {
    checkNoDependencies(
      mockReportError,
      parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }),
    );

    assertSingleMessage(messages, {
      errorMessage: "Unexpected dependencies",
      errorDetails: "you should move them in devDependencies",
      autoFixable: false,
    });
  });

  it('should return no error when "dependencies" is present and is in onlyWarnsFor', () => {
    checkNoDependencies(
      mockReportError,
      parsePkgValue({ name: "test", dependencies: { test: "1.0.0" } }),
      "dependencies",
      "peerDependencies",
    );
    assertSingleMessage(messages, {
      errorMessage: "Unexpected dependencies",
      errorDetails: "you should move them in peerDependencies",
      autoFixable: false,
    });
  });
});
