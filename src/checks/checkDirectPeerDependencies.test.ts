import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createMockReportError } from "../utils/createReportError.testUtils.ts";
import type { PackageJson } from "../utils/packageTypes.ts";
import { createOnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { checkDirectPeerDependencies } from "./checkDirectPeerDependencies.ts";

describe("checkDirectPeerDependencies", () => {
  const { mockReportError, createReportError } = createMockReportError();

  beforeEach(() => {
    mockReportError.mock.resetCalls();
  });

  it("should report error when peer dependency is missing", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(() => ({
      name: "some-lib-using-rollup",
      peerDependencies: { rollup: "^1.0.0" },
    }));

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in devDependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies',
      false,
    ]);
  });

  it("should not report error when peer dependency is in devDependencies", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "rollup",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when peer dependency value is *", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "rollup",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "*" },
      }),
      1,
    );
    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when dev dependency value is a beta", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "rollup",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "*" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          rollup: "^1.0.0-beta.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when dev dependency and peerDependency value are a beta", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "rollup",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0-beta.15" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0-beta.15",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should allow lib to have peer in both dependencies and peerDependencies", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "rollup",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      true,
      {
        name: "test",
        peerDependencies: { rollup: "^1.0.0" },
        dependencies: { rollup: "^1.0.0" },
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should allow missing peer dependency when optional", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(() => ({
      name: "some-lib-using-rollup",
      peerDependencies: { rollup: "^1.0.0" },
      peerDependenciesMeta: {
        rollup: { optional: true },
      },
    }));

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when @types is in dev dependency of an app", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "@types/a",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-types",
        peerDependencies: { "@types/a": "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        dependencies: {
          "some-lib-using-types": "1.0.0",
        },
        devDependencies: {
          "@types/a": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should not report error when @types is missing in dependencies/peerDependency of a library", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "@types/a",
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-types",
        peerDependencies: { "@types/a": "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      true,
      {
        name: "test",
        dependencies: {
          "some-lib-using-types": "1.0.0",
        },
        devDependencies: {
          "@types/a": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Missing "@types/a" peer dependency from "some-lib-using-types" in dependencies',
      'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
      false,
    ]);
  });

  it("should report error even when peer dependency is provided by another dependency for libraries", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-providing-rollup",
        dependencies: { rollup: "^1.0.0" },
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      true,
      {
        name: "test",
        dependencies: {
          "some-lib-using-rollup": "1.0.0",
          "some-lib-providing-rollup": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in dependencies',
      'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
      false,
    ]);
  });

  it("should not report error when peer dependency is provided by another dependency", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-providing-rollup",
        dependencies: { rollup: "^1.0.0" },
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      }),
      1,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        dependencies: {
          "some-lib-using-rollup": "1.0.0",
          "some-lib-providing-rollup": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should report error when peer dependency is provided by multiple dependencies including non-satisfying range", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      }),
      0,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-providing-rollup-1",
        dependencies: { rollup: "^1.0.0" },
      }),
      1,
    );
    getDependencyPackageJsonMock.mock.mockImplementationOnce(
      () => ({
        name: "some-lib-providing-rollup-2",
        dependencies: { rollup: "^2.0.0" },
      }),
      2,
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        dependencies: {
          "some-lib-using-rollup": "1.0.0",
          "some-lib-providing-rollup-1": "1.0.0",
          "some-lib-providing-rollup-2": "1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.deepEqual(
      getDependencyPackageJsonMock.mock.calls.map((c) => c.arguments),
      [
        ["some-lib-using-rollup"],
        ["some-lib-providing-rollup-1"],
        ["some-lib-providing-rollup-2"],
      ],
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in dependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies (required as some dependencies have non-satisfying range too)',
      false,
    ]);
  });

  it("should not report error when peer dependency is marked as peer dependency", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(() => ({
      name: "some-lib-using-rollup",
      peerDependencies: { rollup: "^1.0.0" },
    }));

    checkDirectPeerDependencies(
      true,
      {
        name: "test",
        devDependencies: {
          "some-lib-using-rollup": "1.0.0",
        },
        peerDependencies: {
          "some-lib-using-rollup": "^1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  it("should error when peer dependency is marked as peer dependency but has wrong version", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementation(
      (name): PackageJson =>
        name === "rollup"
          ? {
              name: "rollup",
            }
          : {
              name: "some-lib-using-rollup",
              peerDependencies: { rollup: "^1.0.0" },
            },
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          "some-lib-using-rollup": "1.0.0",
          rollup: "^2.0.0",
        },
        peerDependencies: {
          "some-lib-using-rollup": "^1.0.0",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "rollup" peer dependency',
      '"^2.0.0" (in devDependencies) should satisfies "^1.0.0" from "some-lib-using-rollup" devDependencies',
      false,
    ]);
  });

  it("should error when peer dependency is marked as peer dependency but has wrong dependency version", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementation(
      (name): PackageJson =>
        name === "react-native"
          ? {
              name: "react-native",
              peerDependencies: { react: "18.2.0" },
            }
          : {
              name: "react",
            },
    );

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          "react-native": "1.0.0",
          react: "18.3.0",
        },
        peerDependencies: {
          "react-native": "*",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments, [
      'Invalid "react" peer dependency',
      '"18.3.0" (in devDependencies) should satisfies "18.2.0" from "react-native" devDependencies',
      false,
    ]);
  });

  it("should not report error when dependency is workspace:*", () => {
    const getDependencyPackageJsonMock = mock.fn<GetDependencyPackageJson>();
    getDependencyPackageJsonMock.mock.mockImplementationOnce(() => ({
      name: "alouette-icons",
      peerDependencies: { "alouette-icons": "^1.0.0" },
    }));

    checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          "alouette-icons": "workspace:*",
        },
        peerDependencies: {
          "lib-using-alouette-icons": "*",
        },
      },
      "path",
      getDependencyPackageJsonMock,
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    assert.equal(mockReportError.mock.calls.length, 0);
  });
});
