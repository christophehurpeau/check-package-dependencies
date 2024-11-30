import { describe, it } from "node:test";
import {
  assertCreateReportErrorCall,
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../utils/createReportError.testUtils.ts";
import { checkSatisfiesVersions } from "./checkSatisfiesVersions.ts";

describe("checkSatisfiesVersions", () => {
  const { createReportError, messages } = createMockReportError();

  it("should return no error when range is satisfied", () => {
    checkSatisfiesVersions(
      { name: "test", devDependencies: { test: "1.0.0" } },
      "path",
      "devDependencies",
      { test: "^1.0.0" },
      undefined,
      { customCreateReportError: createReportError },
    );
    assertCreateReportErrorCall(
      createReportError,
      "Satisfies Versions",
      "path",
    );
    assertNoMessages(messages);
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
    assertCreateReportErrorCall(
      createReportError,
      "Satisfies Versions",
      "path",
    );
    assertSingleMessage(messages, {
      title: "Invalid",
      info: '"1.0.0" should satisfies "^2.0.0"',
      dependency: { name: "test", origin: "devDependencies" },
      onlyWarns: undefined,
    });
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
    assertCreateReportErrorCall(
      createReportError,
      "Satisfies Versions",
      "path",
    );
    assertSingleMessage(messages, {
      title: "Missing",
      info: 'should satisfies "^1.0.0"',
      dependency: { name: "test", origin: "devDependencies" },
      onlyWarns: undefined,
    });
  });
});
