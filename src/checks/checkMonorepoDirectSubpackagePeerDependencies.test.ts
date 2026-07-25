import { beforeEach, describe, it, mock } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { createOnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { checkMonorepoDirectSubpackagePeerDependencies } from "./checkMonorepoDirectSubpackagePeerDependencies.ts";

describe("checkMonorepoDirectSubpackagePeerDependencies", () => {
  const { mockReportError, messages } = createMockReportError();

  beforeEach(() => {
    messages.length = 0;
  });

  const eslintPluginPkg: PackageJson = {
    name: "eslint-plugin-example",
    peerDependencies: { eslint: "^9" },
  };

  const run = (subpackagePkg: PackageJson): void => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>(
      () => [eslintPluginPkg, ""],
    );

    checkMonorepoDirectSubpackagePeerDependencies(
      mockReportError,
      true,
      parsePkgValue({
        name: "monorepo-root",
        devDependencies: { eslint: "10.7.0" },
      }),
      parsePkgValue(subpackagePkg),
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
    );
  };

  it("should report invalid root peer dependency when subpackage does not declare it", () => {
    run({
      name: "subpackage",
      dependencies: { "eslint-plugin-example": "^1.0.0" },
    });

    assertSingleMessage(messages, {
      errorMessage: "Invalid peer dependency version",
      errorDetails:
        '"10.7.0" should satisfies "^9" from "eslint-plugin-example" in "dependencies"',
      onlyWarns: false,
      dependency: {
        name: "eslint",
        fieldName: "devDependencies",
        value: "10.7.0",
      },
    });
  });

  it("should skip when subpackage declares the peer dependency in devDependencies", () => {
    run({
      name: "subpackage",
      dependencies: { "eslint-plugin-example": "^1.0.0" },
      devDependencies: { eslint: "^9.0.0" },
    });

    assertNoMessages(messages);
  });

  it("should skip when subpackage declares the peer dependency in peerDependencies (already checked by checkDirectPeerDependencies)", () => {
    run({
      name: "subpackage",
      dependencies: { "eslint-plugin-example": "^1.0.0" },
      peerDependencies: { eslint: "^10.0.2" },
    });

    assertNoMessages(messages);
  });

  it("should skip when subpackage declares the peer dependency in dependencies", () => {
    run({
      name: "subpackage",
      dependencies: { "eslint-plugin-example": "^1.0.0", eslint: "^10.0.2" },
    });

    assertNoMessages(messages);
  });
});
