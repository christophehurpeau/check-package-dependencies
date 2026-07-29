import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { checkSatisfiesVersionsBetweenDependencies } from "./checkSatisfiesVersionsBetweenDependencies.ts";

const createGetDependencyPackageJson =
  (depPkgs: Record<string, PackageJson>): GetDependencyPackageJson =>
  (depName) => {
    const depPkg = depPkgs[depName];
    if (!depPkg) throw new Error(`Unexpected dependency "${depName}"`);
    return [depPkg, `/path/to/node_modules/${depName}/package.json`];
  };

describe("checkSatisfiesVersionsBetweenDependencies", () => {
  const { mockReportError, messages } = createMockReportError();

  const parsedPkg = parsePkgValue({
    name: "test",
    devDependencies: { dep1: "1.0.0" },
    peerDependencies: { dep1: "1.0.0" },
  });

  const check = (
    dep1SharedRange: string,
    dep2SharedRange: string,
    dependencyValue = parsedPkg.devDependencies!.dep1!,
  ): void => {
    checkSatisfiesVersionsBetweenDependencies(
      mockReportError,
      dependencyValue,
      {
        dependencies: [{ name: "shared", from: "dep1", to: "dep2" }],
        getDependencyPackageJson: createGetDependencyPackageJson({
          dep1: { name: "dep1", dependencies: { shared: dep1SharedRange } },
          dep2: { name: "dep2", dependencies: { shared: dep2SharedRange } },
        }),
      },
    );
  };

  it("should return no error when the ranges satisfy", () => {
    check("^1.1.0", "^1.0.0");
    assertNoMessages(messages);
  });

  it("should return no error when the range of the dependency it is compared to is workspace:*", () => {
    check("workspace:*", "^2.0.0");
    assertNoMessages(messages);
  });

  it("should error when the ranges do not satisfy", () => {
    check("^2.0.0", "^1.0.0");
    assertSingleMessage(messages, {
      errorMessage:
        'Version not satisfied between dependencies for dependency "shared"',
      errorDetails:
        '"^2.0.0" from "dep1" dependencies should satisfies "^1.0.0" from "dep2" dependencies',
      onlyWarns: undefined,
    });
  });

  it("should return no error for a field that is not a regular dependency type", () => {
    check("^2.0.0", "^1.0.0", parsedPkg.peerDependencies!.dep1);
    assertNoMessages(messages);
  });

  it("should return no error for a dependency that is not configured", () => {
    const otherPkg = parsePkgValue({
      name: "test",
      devDependencies: { other: "1.0.0" },
    });
    check("^2.0.0", "^1.0.0", otherPkg.devDependencies!.other);
    assertNoMessages(messages);
  });

  it("should read the range in the field configured with `in`", () => {
    checkSatisfiesVersionsBetweenDependencies(
      mockReportError,
      parsedPkg.devDependencies!.dep1!,
      {
        dependencies: [
          {
            name: "shared",
            from: { name: "dep1", in: "devDependencies" },
            to: "dep2",
          },
        ],
        getDependencyPackageJson: createGetDependencyPackageJson({
          dep1: {
            name: "dep1",
            dependencies: { shared: "^1.0.0" },
            devDependencies: { shared: "^2.0.0" },
          },
          dep2: { name: "dep2", dependencies: { shared: "^1.0.0" } },
        }),
      },
    );

    assertSingleMessage(messages, {
      errorMessage:
        'Version not satisfied between dependencies for dependency "shared"',
      errorDetails:
        '"^2.0.0" from "dep1" devDependencies should satisfies "^1.0.0" from "dep2" dependencies',
      onlyWarns: undefined,
    });
  });

  it("should throw when a dependency does not declare the compared dependency", () => {
    assert.throws(() => check("^1.0.0", ""), {
      message: 'Dependency "dep2" has no dependency "shared" in "dependencies"',
    });
  });
});
