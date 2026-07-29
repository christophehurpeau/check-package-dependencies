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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: { rollup: "1.0.0" },
        dependencies: { rollup: "1.0.0" },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["dependencies", "devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

    assertSingleMessage(messages, {
      errorMessage:
        'Invalid "rollup" present in dependencies and devDependencies',
      errorDetails: "please place it only in dependencies",
    });
  });

  it("should report error when is in multiple types with same version and is a library", () => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: { rollup: "1.0.0" },
        dependencies: { rollup: "1.0.0" },
      }),
      isPkgLibrary: true,
      depType: "dependencies",
      searchIn: ["dependencies", "devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

    assertSingleMessage(messages, {
      errorMessage:
        'Invalid "rollup" has same version in dependencies and devDependencies',
      errorDetails:
        "please place it only in dependencies or use range in dependencies",
      dependency: { name: "rollup", fieldName: "dependencies", value: "1.0.0" },
    });
  });

  it("should report error when dependency does not intersect", () => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0-beta.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^1.0.0-beta.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

    assertNoMessages(messages);
  });

  it("should not report error when dependency is in onlyWarnsFor", () => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", ["rollup"]),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "peerDependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

    assertNoMessages(messages);
  });

  it("should report error when dependency is in peerDependencies and allowPeerDependencies is false", () => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: true,
      depType: "peerDependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^2.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@^6.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

    assertNoMessages(messages);
  });

  it("should report error when both are npm aliases of the same package with non intersecting ranges", () => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@^7.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "^5.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6@6.0.2",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:other-typescript@1.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "next",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "^2.0.0" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          typescript: "npm:@typescript/typescript6",
          "some-lib-using-typescript": "1.0.0",
        },
      }),
      isPkgLibrary: false,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-typescript",
        dependencies: { typescript: "npm:@typescript/typescript6@next" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });

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
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "test",
        devDependencies: {
          rollup: "1.0.0",
          "some-lib-using-rollup": "1.0.0",
        },
      }),
      isPkgLibrary: true,
      depType: "dependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "some-lib-using-rollup",
        dependencies: { rollup: "latest" },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
    });
    assertNoMessages(messages);
  });
});

describe("checkDuplicateDependencies with conflictOwnership", () => {
  const { mockReportError, messages } = createMockReportError();

  interface CheckWithOwnershipParams {
    /** the range of the checked package */
    version: string;
    /** the range of the other package it is compared with */
    depRange: string;
    ownsUnorderedConflicts?: boolean;
  }

  const checkWithOwnership = ({
    version,
    depRange,
    ownsUnorderedConflicts = true,
  }: CheckWithOwnershipParams): void => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue({
        name: "checked-package",
        devDependencies: { rollup: version },
      }),
      isPkgLibrary: false,
      depType: "devDependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "other-package",
        devDependencies: { rollup: depRange },
      },
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck("test", []),
      conflictOwnership: { ownsUnorderedConflicts },
    });
  };

  it("should report the lower range with the higher one as fix", () => {
    checkWithOwnership({ version: "4.1.9", depRange: "4.1.10" });

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"4.1.9" should satisfies "4.1.10" from other-package in devDependencies',
      errorTarget: "dependencyValue",
      fixTo: "4.1.10",
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "4.1.9",
      },
    });
  });

  it("should not report the higher range, the other package reports it", () => {
    checkWithOwnership({ version: "4.1.10", depRange: "4.1.9" });

    assertNoMessages(messages);
  });

  it("should not report the higher range either when it owns unordered conflicts", () => {
    checkWithOwnership({
      version: "^7.0.0",
      depRange: "^6.0.0",
      ownsUnorderedConflicts: true,
    });

    assertNoMessages(messages);
  });

  it("should report without a fix when the ranges have no minimum version", () => {
    checkWithOwnership({ version: "1.0.0", depRange: "<0.0.0-0" });

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"1.0.0" should satisfies "<0.0.0-0" from other-package in devDependencies',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "1.0.0",
      },
    });
  });

  it("should not report a range with no minimum version when it does not own unordered conflicts", () => {
    checkWithOwnership({
      version: "1.0.0",
      depRange: "<0.0.0-0",
      ownsUnorderedConflicts: false,
    });

    assertNoMessages(messages);
  });

  it("should report packages installed under the same name when it owns unordered conflicts", () => {
    checkWithOwnership({
      version: "npm:@typescript/typescript6@6.0.2",
      depRange: "npm:other-typescript@6.0.2",
    });

    assertSingleMessage(messages, {
      errorMessage: "Invalid duplicate dependency",
      errorDetails:
        '"npm:@typescript/typescript6@6.0.2" and "npm:other-typescript@6.0.2" from other-package in devDependencies install different packages',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "npm:@typescript/typescript6@6.0.2",
      },
    });
  });

  it("should not report packages installed under the same name when it does not own unordered conflicts", () => {
    checkWithOwnership({
      version: "npm:@typescript/typescript6@6.0.2",
      depRange: "npm:other-typescript@6.0.2",
      ownsUnorderedConflicts: false,
    });

    assertNoMessages(messages);
  });

  it("should report an unsupported range when it owns unordered conflicts", () => {
    checkWithOwnership({ version: "next", depRange: "^2.0.0" });

    assertSingleMessage(messages, {
      errorMessage: 'Unsupported range for "rollup"',
      errorDetails:
        '"next" is not a valid semver range, "next" cannot be compared with "^2.0.0" from other-package in devDependencies',
      onlyWarns: false,
      dependency: {
        name: "rollup",
        fieldName: "devDependencies",
        value: "next",
      },
    });
  });

  it("should not report an unsupported range when it does not own unordered conflicts", () => {
    checkWithOwnership({
      version: "next",
      depRange: "^2.0.0",
      ownsUnorderedConflicts: false,
    });

    assertNoMessages(messages);
  });
});
