import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { checkSatisfiesVersionsBetweenDependencies } from "./checkSatisfiesVersionsBetweenDependencies.ts";

describe(checkSatisfiesVersionsBetweenDependencies.name, () => {
  const { mockReportError, messages } = createMockReportError();

  const dep1Pkg: PackageJson = {
    name: "dep1",
    dependencies: { shared: "^1.0.0" },
  };

  it("should return no error when versions satisfy", () => {
    checkSatisfiesVersionsBetweenDependencies(
      mockReportError,
      dep1Pkg,
      "dependencies",
      ["shared"],
      { name: "dep2", dependencies: { shared: "^1.1.0" } },
      "dependencies",
      { shouldHaveExactVersions: () => false },
    );
    assertNoMessages(messages);
  });

  it("should return no error when dep2 uses workspace:*", () => {
    checkSatisfiesVersionsBetweenDependencies(
      mockReportError,
      dep1Pkg,
      "dependencies",
      ["shared"],
      { name: "dep2", dependencies: { shared: "workspace:*" } },
      "dependencies",
      { shouldHaveExactVersions: () => false },
    );
    assertNoMessages(messages);
  });

  it("should return error when versions do not satisfy", () => {
    checkSatisfiesVersionsBetweenDependencies(
      mockReportError,
      dep1Pkg,
      "dependencies",
      ["shared"],
      { name: "dep2", dependencies: { shared: "^2.0.0" } },
      "dependencies",
      { shouldHaveExactVersions: () => false },
    );
    assertSingleMessage(messages, {
      errorMessage: 'Invalid "shared" in "dependencies" of "dep2"',
      errorDetails:
        '"^2.0.0" should satisfies "^1.0.0" from "dep1" in "dependencies"',
      onlyWarns: undefined,
    });
  });
});
