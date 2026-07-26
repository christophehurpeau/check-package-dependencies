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

  it("should not report error when both are npm aliases of the same package with intersecting ranges", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@^6.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertNoMessages(messages);
  });

  it("should report error when both are npm aliases of the same package with non intersecting ranges", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@^7.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"npm:@typescript/typescript6@6.0.2" should satisfies "npm:@typescript/typescript6@^7.0.0" from some-lib-using-typescript in dependencies',
      onlyWarns: false,
      dependency: {
        name: "typescript",
        fieldName: "devDependencies",
        value: "npm:@typescript/typescript6@6.0.2",
      },
    });
  });

  it("should report error when only one of the two is an npm alias", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "^5.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"npm:@typescript/typescript6@6.0.2" and "^5.0.0" from some-lib-using-typescript in dependencies install different packages',
      onlyWarns: false,
      dependency: {
        name: "typescript",
        fieldName: "devDependencies",
        value: "npm:@typescript/typescript6@6.0.2",
      },
    });
  });

  it("should report error when the npm aliases point to different packages", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:other-typescript@1.0.0" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"npm:@typescript/typescript6@6.0.2" and "npm:other-typescript@1.0.0" from some-lib-using-typescript in dependencies install different packages',
      onlyWarns: false,
      dependency: {
        name: "typescript",
        fieldName: "devDependencies",
        value: "npm:@typescript/typescript6@6.0.2",
      },
    });
  });

  it("should report error when the dependency's value is a dist tag", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "next",
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
      errorMessage: 'Unsupported range for "rollup"',
      errorDetails:
        '"next" is not a valid semver range, "next" cannot be compared with "^2.0.0" from some-lib-using-rollup in dependencies',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "next",
      },
    });
  });

  it("should report error when the npm alias range is a dist tag", () => {
    checkDuplicateDependencies(
      mockReportError,
      parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      false,
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@next" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );

    assertSingleMessage(messages, {
      errorMessage: 'Unsupported range for "typescript"',
      errorDetails:
        '"next" is not a valid semver range, "npm:@typescript/typescript6" cannot be compared with "npm:@typescript/typescript6@next" from some-lib-using-typescript in dependencies',
      onlyWarns: false,
      dependency: {
        name: "typescript",
        fieldName: "devDependencies",
        value: "npm:@typescript/typescript6",
      },
    });
  });

  it("should not report error when dependency's value is latest", () => {
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
      "dependencies",
      ["devDependencies"],
      {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "latest" },
      },
      createOnlyWarnsForArrayCheck("test", []),
    );
    assertNoMessages(messages);
  });
});
