import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { checkIdenticalVersionsThanDependency } from "./checkIdenticalVersionsThanDependency.ts";

describe("checkIdenticalVersionsThanDependency", () => {
  const { mockReportError, messages } = createMockReportError();

  const depPkg = { name: "dep-package" };

  it("should not report when version matches", () => {
    checkIdenticalVersionsThanDependency(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { react: "18.2.0" } }),
      "devDependencies",
      ["react"],
      depPkg,
      { react: "18.2.0" },
    );
    assertNoMessages(messages);
  });

  it("should report when version does not match", () => {
    checkIdenticalVersionsThanDependency(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { react: "18.0.0" } }),
      "devDependencies",
      ["react"],
      depPkg,
      { react: "18.2.0" },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Invalid "18.0.0"',
      errorDetails: 'expecting "18.0.0" to be "18.2.0" from "dep-package"',
      dependency: {
        name: "react",
        fieldName: "devDependencies",
        value: "18.0.0",
      },
      onlyWarns: undefined,
    });
  });

  it("should report when dep key is missing from external package", () => {
    checkIdenticalVersionsThanDependency(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { react: "18.2.0" } }),
      "devDependencies",
      ["react"],
      depPkg,
      {},
    );
    assertSingleMessage(messages, {
      errorMessage: 'Unexpected missing dependency "react" in "dep-package"',
      errorDetails: 'config expects "react" to be present',
    });
  });

  it("should report when external package has a range version", () => {
    checkIdenticalVersionsThanDependency(
      mockReportError,
      parsePkgValue({ name: "test", devDependencies: { react: "18.2.0" } }),
      "devDependencies",
      ["react"],
      depPkg,
      { react: "^18.2.0" },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Unexpected range dependency "react" in "dep-package"',
      errorDetails:
        "perhaps use checkSatisfiesVersionsFromDependency() instead",
    });
  });

  it("should report when dep is missing in current package", () => {
    checkIdenticalVersionsThanDependency(
      mockReportError,
      parsePkgValue({ name: "test" }),
      "devDependencies",
      ["react"],
      depPkg,
      { react: "18.2.0" },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Missing "react"',
      errorDetails: 'expecting to be "18.2.0"',
      dependency: { name: "react", fieldName: "devDependencies" },
      onlyWarns: undefined,
    });
  });
});
