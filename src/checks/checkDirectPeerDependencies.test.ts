import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOnlyWarnsForMappingCheck } from "../utils/warnForUtils";
import { checkDirectPeerDependencies } from "./checkDirectPeerDependencies";

describe("checkDirectPeerDependencies", () => {
  const mockReportError = vi.fn();
  const createReportError = vi.fn().mockReturnValue(mockReportError);
  beforeEach(() => {
    mockReportError.mockReset();
  });

  it("should report error when peer dependency is missing", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      vi.fn().mockImplementationOnce(() => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in devDependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies',
      false,
    );
  });

  it("should not report error when peer dependency is in devDependencies", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "rollup",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when peer dependency value is *", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "rollup",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "*" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when dev dependency value is a beta", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          rollup: "^1.0.0-beta.0",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "rollup",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "*" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when dev dependency and peerDependency value are a beta", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: {
          rollup: "1.0.0-beta.15",
          "some-lib-using-rollup": "1.0.0",
        },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "rollup",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0-beta.15" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should allow lib to have peer in both dependencies and peerDependencies", async () => {
    await checkDirectPeerDependencies(
      true,
      {
        name: "test",
        peerDependencies: { rollup: "^1.0.0" },
        dependencies: { rollup: "^1.0.0" },
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "rollup",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should allow missing peer dependency when optional", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        devDependencies: { "some-lib-using-rollup": "1.0.0" },
      },
      "path",
      vi.fn().mockImplementationOnce(() => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
        peerDependenciesMeta: {
          rollup: { optional: true },
        },
      })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when @types is in dev dependency of an app", async () => {
    await checkDirectPeerDependencies(
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
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "@types/a",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-types",
          peerDependencies: { "@types/a": "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should not report error when @types is missing in dependencies/peerDependency of a library", async () => {
    await checkDirectPeerDependencies(
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
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "@types/a",
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-types",
          peerDependencies: { "@types/a": "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "@types/a" peer dependency from "some-lib-using-types" in dependencies',
      'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
      false,
    );
  });

  it("should report error even when peer dependency is provided by another dependency for libraries", async () => {
    await checkDirectPeerDependencies(
      true,
      {
        name: "test",
        dependencies: {
          "some-lib-using-rollup": "1.0.0",
          "some-lib-providing-rollup": "1.0.0",
        },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "some-lib-providing-rollup",
          dependencies: { rollup: "^1.0.0" },
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in dependencies',
      'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
      false,
    );
  });

  it("should not report error when peer dependency is provided by another dependency", async () => {
    await checkDirectPeerDependencies(
      false,
      {
        name: "test",
        dependencies: {
          "some-lib-using-rollup": "1.0.0",
          "some-lib-providing-rollup": "1.0.0",
        },
      },
      "path",
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "some-lib-providing-rollup",
          dependencies: { rollup: "^1.0.0" },
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should report error when peer dependency is provided by multiple dependencies including non-satisfying range", async () => {
    await checkDirectPeerDependencies(
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
      vi
        .fn()
        .mockImplementationOnce(() => ({
          name: "some-lib-using-rollup",
          peerDependencies: { rollup: "^1.0.0" },
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-providing-rollup-1",
          dependencies: { rollup: "^1.0.0" },
        }))
        .mockImplementationOnce(() => ({
          name: "some-lib-providing-rollup-2",
          dependencies: { rollup: "^2.0.0" },
        })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Missing "rollup" peer dependency from "some-lib-using-rollup" in dependencies',
      'it should satisfies "^1.0.0" and be in devDependencies or dependencies (required as some dependencies have non-satisfying range too)',
      false,
    );
  });

  it("should not report error when peer dependency is marked as peer dependency", async () => {
    await checkDirectPeerDependencies(
      false,
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
      vi.fn().mockImplementationOnce(() => ({
        name: "some-lib-using-rollup",
        peerDependencies: { rollup: "^1.0.0" },
      })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it("should error when peer dependency is marked as peer dependency but has wrong version", async () => {
    await checkDirectPeerDependencies(
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
      vi.fn().mockImplementation((name) =>
        name === "rollup"
          ? {
              name: "rollup",
            }
          : {
              name: "some-lib-using-rollup",
              peerDependencies: { rollup: "^1.0.0" },
            },
      ),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenLastCalledWith(
      'Invalid "rollup" peer dependency',
      '"^2.0.0" (in devDependencies) should satisfies "^1.0.0" from "some-lib-using-rollup" devDependencies',
      false,
    );
  });

  it("should error when peer dependency is marked as peer dependency but has wrong dependency version", async () => {
    await checkDirectPeerDependencies(
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
      vi.fn().mockImplementation((name) =>
        name === "react-native"
          ? {
              name: "react-native",
              peerDependencies: { react: "18.2.0" },
            }
          : {
              name: "react",
            },
      ),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenLastCalledWith(
      'Invalid "react" peer dependency',
      '"18.3.0" (in devDependencies) should satisfies "18.2.0" from "react-native" devDependencies',
      false,
    );
  });

  it("should not report error when dependency is workspace:*", async () => {
    await checkDirectPeerDependencies(
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
      vi.fn().mockImplementationOnce(() => ({
        name: "alouette-icons",
        peerDependencies: { "alouette-icons": "^1.0.0" },
      })),
      createOnlyWarnsForMappingCheck("test", []),
      createOnlyWarnsForMappingCheck("test", []),
      createReportError,
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
