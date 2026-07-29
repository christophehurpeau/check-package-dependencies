import { describe, it, mock } from "node:test";
import {
  assertNoMessages,
  assertSingleMessage,
  createMockReportError,
} from "../reporting/ReportError.testUtils.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { parsePkgValue } from "../utils/pkgJsonUtils.ts";
import { createOnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { checkWorkspaceMemberPeerDependencies } from "./checkWorkspaceMemberPeerDependencies.ts";

describe("checkWorkspaceMemberPeerDependencies", () => {
  const { mockReportError, messages } = createMockReportError();

  const eslintPluginPkg: PackageJson = {
    name: "eslint-plugin-example",
    peerDependencies: { eslint: "^9" },
  };

  const getDependencyPackageJson = (): GetDependencyPackageJson =>
    mock.fn<GetDependencyPackageJson>(() => [eslintPluginPkg, ""]);

  const run = (memberPkg: PackageJson): void => {
    checkWorkspaceMemberPeerDependencies(mockReportError, {
      rootPkg: parsePkgValue({
        name: "monorepo-root",
        devDependencies: { eslint: "10.7.0" },
      }),
      memberPkg: parsePkgValue(memberPkg),
      getDependencyPackageJson: getDependencyPackageJson(),
      onlyWarnsForMappingCheck: createOnlyWarnsForMappingCheck("test", []),
    });
  };

  it("should report an invalid root peer dependency when the member does not declare it", () => {
    run({
      name: "workspace-member",
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

  it("should skip when the member declares the peer dependency in devDependencies", () => {
    run({
      name: "workspace-member",
      dependencies: { "eslint-plugin-example": "^1.0.0" },
      devDependencies: { eslint: "^9.0.0" },
    });

    assertNoMessages(messages);
  });

  it("should skip when the member declares the peer dependency in peerDependencies (already checked by checkDirectPeerDependencies)", () => {
    run({
      name: "workspace-member",
      dependencies: { "eslint-plugin-example": "^1.0.0" },
      peerDependencies: { eslint: "^10.0.2" },
    });

    assertNoMessages(messages);
  });

  it("should skip when the member declares the peer dependency in dependencies", () => {
    run({
      name: "workspace-member",
      dependencies: { "eslint-plugin-example": "^1.0.0", eslint: "^10.0.2" },
    });

    assertNoMessages(messages);
  });

  it("should skip a dependency the workspace root already declares in devDependencies", () => {
    checkWorkspaceMemberPeerDependencies(mockReportError, {
      rootPkg: parsePkgValue({
        name: "monorepo-root",
        devDependencies: {
          "eslint-plugin-example": "^1.0.0",
          eslint: "10.7.0",
        },
      }),
      memberPkg: parsePkgValue({
        name: "workspace-member",
        dependencies: { "eslint-plugin-example": "^1.0.0" },
      }),
      getDependencyPackageJson: getDependencyPackageJson(),
      onlyWarnsForMappingCheck: createOnlyWarnsForMappingCheck("test", []),
    });

    assertNoMessages(messages);
  });
});
