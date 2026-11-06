import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSeveralMessages,
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
      depPkgPath: "other-package/package.json",
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
    pkgPath?: string;
    depPkgPath?: string;
  }

  const checkWithOwnership = ({
    version,
    depRange,
    ownsUnorderedConflicts = true,
    pkgPath = "packages/checked-package/package.json",
    depPkgPath = "packages/other-package/package.json",
  }: CheckWithOwnershipParams): void => {
    checkDuplicateDependencies({
      reportError: mockReportError,
      pkg: parsePkgValue(
        {
          name: "checked-package",
          devDependencies: { rollup: version },
        },
        pkgPath,
      ),
      isPkgLibrary: false,
      depType: "devDependencies",
      searchIn: ["devDependencies"],
      depPkg: {
        name: "other-package",
        devDependencies: { rollup: depRange },
      },
      depPkgPath,
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

  describe("non-semver specifiers", () => {
    const link = "link:../../../reviewflow/packages/sdk";

    it("should not report identical link: specifiers", () => {
      checkWithOwnership({ version: link, depRange: link });
      checkWithOwnership({
        version: link,
        depRange: link,
        ownsUnorderedConflicts: false,
      });

      assertNoMessages(messages);
    });

    for (const spec of [
      "portal:../sdk",
      "git+https://github.com/owner/repo.git#v1.0.0",
      "github:owner/repo#main",
      "owner/repo",
      "https://example.com/sdk.tgz",
    ]) {
      it(`should not report the identical specifier ${spec}`, () => {
        checkWithOwnership({ version: spec, depRange: spec });

        assertNoMessages(messages);
      });
    }

    it("should not report link: paths to the same directory from different depths", () => {
      checkWithOwnership({
        version: "link:../../../sdk",
        depRange: "link:../sdk",
        depPkgPath: "package.json",
      });
      checkWithOwnership({
        version: "portal:../../../sdk",
        depRange: "portal:../sdk",
        depPkgPath: "package.json",
      });

      assertNoMessages(messages);
    });

    it("should report identical link: strings pointing to different directories", () => {
      checkWithOwnership({
        version: "link:../sdk",
        depRange: "link:../sdk",
        depPkgPath: "package.json",
      });

      assertSingleMessage(messages, {
        errorMessage: 'Inconsistent non-semver dependency "rollup"',
        errorDetails:
          '"link:../sdk" and "link:../sdk" from other-package in devDependencies do not resolve to the same source, a specifier that is not a semver range only matching an identical one',
        onlyWarns: false,
        dependency: {
          name: "rollup",
          fieldName: "devDependencies",
          value: "link:../sdk",
        },
      });
    });

    it("should report differing link: paths", () => {
      checkWithOwnership({
        version: "link:../sdk",
        depRange: "link:../../sdk",
      });

      assertSingleMessage(messages, {
        errorMessage: 'Inconsistent non-semver dependency "rollup"',
        errorDetails:
          '"link:../sdk" and "link:../../sdk" from other-package in devDependencies do not resolve to the same source, a specifier that is not a semver range only matching an identical one',
        onlyWarns: false,
        dependency: {
          name: "rollup",
          fieldName: "devDependencies",
          value: "link:../sdk",
        },
      });
    });

    it("should report a link: specifier against a semver range, on either side", () => {
      checkWithOwnership({ version: "link:../sdk", depRange: "^2.0.0" });
      checkWithOwnership({ version: "^2.0.0", depRange: "link:../sdk" });

      assertSeveralMessages(
        messages,
        ["link:../sdk", "^2.0.0"].map((value, index) => ({
          errorMessage: 'Inconsistent non-semver dependency "rollup"',
          errorDetails: `"${value}" and "${index === 0 ? "^2.0.0" : "link:../sdk"}" from other-package in devDependencies do not resolve to the same source, a specifier that is not a semver range only matching an identical one`,
          onlyWarns: false,
          dependency: {
            name: "rollup",
            fieldName: "devDependencies",
            value,
          },
        })),
      );
    });

    it("should report a link: specifier against a git specifier", () => {
      checkWithOwnership({
        version: "link:../sdk",
        depRange: "github:owner/repo",
      });

      assertSingleMessage(messages, {
        errorMessage: 'Inconsistent non-semver dependency "rollup"',
        errorDetails:
          '"link:../sdk" and "github:owner/repo" from other-package in devDependencies do not resolve to the same source, a specifier that is not a semver range only matching an identical one',
        onlyWarns: false,
        dependency: {
          name: "rollup",
          fieldName: "devDependencies",
          value: "link:../sdk",
        },
      });
    });

    it("should not report a differing link: when it does not own unordered conflicts", () => {
      checkWithOwnership({
        version: "link:../sdk",
        depRange: "^2.0.0",
        ownsUnorderedConflicts: false,
      });

      assertNoMessages(messages);
    });

    it("should not report identical dist-tags", () => {
      checkWithOwnership({ version: "next", depRange: "next" });

      assertNoMessages(messages);
    });
  });
});
