import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { createOnlyWarnsForArrayCheck } from "../utils/warnForUtils.ts";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.ts";

describe("checkDuplicateDependencies", () => {
  const { mockReportError, messages } = createMockReportError();

  it("should report error when is in multiple types and not a library", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: { rollup: "1.0.0" },
        dependencies: { rollup: "1.0.0" },
      }),
      false,
      "dependencies",
      ["dependencies", "devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage:
        'Invalid "rollup" present in dependencies and devDependencies',
      errorDetails: "please place it only in dependencies",
    });
  });

  it("should report error when is in multiple types with same version and is a library", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: { rollup: "1.0.0" },
        dependencies: { rollup: "1.0.0" },
      }),
      true,
      "dependencies",
      ["dependencies", "devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage:
        'Invalid "rollup" has same version in dependencies and devDependencies',
      errorDetails:
        "please place it only in dependencies or use range in dependencies",
      dependency: { name: "rollup", fieldName: "dependencies", value: "1.0.0" },
    });
  });

  it("should report error when dependency does not intersect", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in dependencies',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
    });
  });

  it("should not report error when dev dependency value is a beta", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0-beta.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0-beta.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertNoMessages(messages);
  });

  it("should not report error when dependency is in onlyWarnsFor", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", ["rollup"]),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in dependencies',
      onlyWarns: true,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
    });
  });

  it("should not report error when dependency is in peerDependencies", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      false,
      "peerDependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertNoMessages(messages);
  });

  it("should report error when dependency is in peerDependencies and allowPeerDependencies is false", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      true,
      "peerDependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^2.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"1.0.0" should satisfies "^2.0.0" from some-lib-using-rollup in peerDependencies',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
    });
  });
});
