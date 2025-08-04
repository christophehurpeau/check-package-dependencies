import assert from "node:assert/strict";
import { beforeEach, describe, it, mock } from "node:test";
import { assertNoMessages, assertSingleMessage, createMockReportError, } from "../reporting/ReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { createOnlyWarnsForMappingCheck } from "../utils/warnForUtils.js";
import { checkDirectPeerDependencies } from "./checkDirectPeerDependencies.js";
describe("checkDirectPeerDependencies", () => {
    const { mockReportError, messages } = createMockReportError();
    beforeEach(() => {
        messages.length = 0;
    });
    it("should report error when peer dependency is missing", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: { "some-lib-using-rollup": "1.0.0" },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertSingleMessage(messages, {
            errorMessage: 'Missing "rollup" peer dependency from "some-lib-using-rollup" in "devDependencies"',
            errorDetails: 'it should satisfies "^1.0.0" and be in devDependencies or dependencies',
            onlyWarns: false,
            dependency: { name: "rollup" },
        });
    });
    it("should not report error when peer dependency is in devDependencies", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "rollup",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when peer dependency value is *", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "rollup",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "*" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: { rollup: "^1.0.0", "some-lib-using-rollup": "1.0.0" },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when dev dependency value is a beta", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "rollup",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "*" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: {
                rollup: "^1.0.0-beta.0",
                "some-lib-using-rollup": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when dev dependency and peerDependency value are a beta", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "rollup",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0-beta.15" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: {
                rollup: "1.0.0-beta.15",
                "some-lib-using-rollup": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should allow lib to have peer in both dependencies and peerDependencies", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "rollup",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, true, parsePkgValue({
            name: "test",
            peerDependencies: { rollup: "^1.0.0" },
            dependencies: { rollup: "^1.0.0" },
            devDependencies: { "some-lib-using-rollup": "1.0.0" },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should allow missing peer dependency when optional", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
                peerDependenciesMeta: {
                    rollup: { optional: true },
                },
            },
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: { "some-lib-using-rollup": "1.0.0" },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when @types is in dev dependency of an app", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "@types/a",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-types",
                peerDependencies: { "@types/a": "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            dependencies: {
                "some-lib-using-types": "1.0.0",
            },
            devDependencies: {
                "@types/a": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when @types is missing in dependencies/peerDependency of a library", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "@types/a",
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-types",
                peerDependencies: { "@types/a": "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, true, parsePkgValue({
            name: "test",
            dependencies: {
                "some-lib-using-types": "1.0.0",
            },
            devDependencies: {
                "@types/a": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertSingleMessage(messages, {
            errorMessage: 'Missing "@types/a" peer dependency from "some-lib-using-types" in "dependencies"',
            errorDetails: 'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
            onlyWarns: false,
            dependency: { name: "@types/a" },
        });
    });
    it("should report error even when peer dependency is provided by another dependency for libraries", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-providing-rollup",
                dependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, true, parsePkgValue({
            name: "test",
            dependencies: {
                "some-lib-using-rollup": "1.0.0",
                "some-lib-providing-rollup": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertSingleMessage(messages, {
            errorMessage: 'Missing "rollup" peer dependency from "some-lib-using-rollup" in "dependencies"',
            errorDetails: 'it should satisfies "^1.0.0" and be in dependencies or peerDependencies',
            onlyWarns: false,
            dependency: { name: "rollup" },
        });
    });
    it("should not report error when peer dependency is provided by another dependency", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-providing-rollup",
                dependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 1);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            dependencies: {
                "some-lib-using-rollup": "1.0.0",
                "some-lib-providing-rollup": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should report error when peer dependency is provided by multiple dependencies including non-satisfying range", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 0);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-providing-rollup-1",
                dependencies: { rollup: "^1.0.0" },
            },
            "",
        ], 1);
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-providing-rollup-2",
                dependencies: { rollup: "^2.0.0" },
            },
            "",
        ], 2);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            dependencies: {
                "some-lib-using-rollup": "1.0.0",
                "some-lib-providing-rollup-1": "1.0.0",
                "some-lib-providing-rollup-2": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assert.deepEqual(getDependencyPackageJsonMock.mock.calls.map((c) => c.arguments), [
            ["some-lib-using-rollup"],
            ["some-lib-providing-rollup-1"],
            ["some-lib-providing-rollup-2"],
        ]);
        assertSingleMessage(messages, {
            errorMessage: 'Missing "rollup" peer dependency from "some-lib-using-rollup" in "dependencies"',
            errorDetails: 'it should satisfies "^1.0.0" and be in devDependencies or dependencies (required as some dependencies have non-satisfying range too)',
            onlyWarns: false,
            dependency: { name: "rollup" },
        });
    });
    it("should not report error when peer dependency is marked as peer dependency", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "some-lib-using-rollup",
                peerDependencies: { rollup: "^1.0.0" },
            },
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, true, parsePkgValue({
            name: "test",
            devDependencies: {
                "some-lib-using-rollup": "1.0.0",
            },
            peerDependencies: {
                "some-lib-using-rollup": "^1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should error when peer dependency is marked as peer dependency but has wrong version", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementation((name) => [
            (name === "rollup"
                ? {
                    name: "rollup",
                }
                : {
                    name: "some-lib-using-rollup",
                    peerDependencies: { rollup: "^1.0.0" },
                }),
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: {
                "some-lib-using-rollup": "1.0.0",
                rollup: "^2.0.0",
            },
            peerDependencies: {
                "some-lib-using-rollup": "^1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertSingleMessage(messages, {
            errorMessage: "Invalid peer dependency version",
            errorDetails: '"^2.0.0" should satisfies "^1.0.0" from "some-lib-using-rollup" in "devDependencies"',
            onlyWarns: false,
            dependency: {
                name: "rollup",
                fieldName: "devDependencies",
                value: "^2.0.0",
            },
        });
    });
    it("should error when peer dependency is marked as peer dependency but has wrong dependency version", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementation((name) => [
            (name === "react-native"
                ? {
                    name: "react-native",
                    peerDependencies: { react: "18.2.0" },
                }
                : {
                    name: "react",
                }),
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            dependencies: {
                "react-native": "1.0.0",
            },
            devDependencies: {
                react: "18.3.0",
            },
            peerDependencies: {
                "react-native": "*",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertSingleMessage(messages, {
            errorMessage: "Invalid peer dependency version",
            errorDetails: '"18.3.0" should satisfies "18.2.0" from "react-native" in "dependencies"',
            dependency: {
                name: "react",
                fieldName: "devDependencies",
                value: "18.3.0",
            },
            onlyWarns: false,
        });
    });
    it("should not report error when dependency is workspace:*", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "lib-using-alouette-icons",
                peerDependencies: { "alouette-icons": "^1.0.0" },
            },
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: {
                "alouette-icons": "workspace:*",
            },
            peerDependencies: {
                "lib-using-alouette-icons": "*",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
    it("should not report error when peer dependency is a range with invalid comparator if not used with loose", () => {
        const getDependencyPackageJsonMock = mock.fn();
        getDependencyPackageJsonMock.mock.mockImplementationOnce(() => [
            {
                name: "lib-using-alouette-icons",
                peerDependencies: { "alouette-icons": ">=3.16.0 || >=4.0.0-" },
            },
            "",
        ]);
        checkDirectPeerDependencies(mockReportError, false, parsePkgValue({
            name: "test",
            devDependencies: {
                "alouette-icons": "3.17.0",
            },
            peerDependencies: {
                "lib-using-alouette-icons": "1.0.0",
            },
        }), getDependencyPackageJsonMock, createOnlyWarnsForMappingCheck("test", []), createOnlyWarnsForMappingCheck("test", []));
        assertNoMessages(messages);
    });
});
//# sourceMappingURL=checkDirectPeerDependencies.test.js.map