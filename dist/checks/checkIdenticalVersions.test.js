import { describe, it } from "node:test";
import { assertNoMessages, assertSeveralMessages, assertSingleMessage, createMockReportError, } from "../reporting/ReportError.testUtils.js";
import { parsePkgValue } from "../utils/pkgJsonUtils.js";
import { checkIdenticalVersions } from "./checkIdenticalVersions.js";
describe("checkIdenticalVersions", () => {
    const { mockReportError, messages } = createMockReportError();
    describe("devDependencies in array", () => {
        it("should return no error when all versions are identical", () => {
            checkIdenticalVersions(mockReportError, parsePkgValue({
                name: "test",
                devDependencies: { react: "1.0.0", "react-dom": "1.0.0" },
            }), "devDependencies", {
                react: ["react-dom"],
            }, undefined);
            assertNoMessages(messages);
        });
        it("should return error when versions are not identical", () => {
            checkIdenticalVersions(mockReportError, parsePkgValue({
                name: "test",
                devDependencies: { react: "1.0.0", "react-dom": "1.0.1" },
            }), "devDependencies", {
                react: ["react-dom"],
            }, undefined);
            assertSingleMessage(messages, {
                errorMessage: 'Invalid "react-dom"',
                errorDetails: 'expecting "1.0.1" to be "1.0.0" identical to "react" in "devDependencies"',
                dependency: {
                    name: "react-dom",
                    fieldName: "devDependencies",
                    value: "1.0.1",
                },
                onlyWarns: undefined,
            });
        });
    });
    describe("object with dependencies and devDependencies", () => {
        it("should return no error when all versions are identical", () => {
            checkIdenticalVersions(mockReportError, parsePkgValue({
                name: "test",
                dependencies: { react: "1.0.0", "react-dom": "1.0.0" },
                devDependencies: { "react-test-renderer": "1.0.0" },
            }), "dependencies", {
                react: {
                    dependencies: ["react-dom"],
                    devDependencies: ["react-test-renderer"],
                },
            }, undefined);
            assertNoMessages(messages);
        });
        it("should return error when versions are not identical", () => {
            checkIdenticalVersions(mockReportError, parsePkgValue({
                name: "test",
                dependencies: { react: "1.0.0", "react-dom": "1.0.1" },
                devDependencies: { "react-test-renderer": "1.0.1" },
            }), "dependencies", {
                react: {
                    dependencies: ["react-dom"],
                    devDependencies: ["react-test-renderer"],
                },
            }, undefined);
            assertSeveralMessages(messages, [
                {
                    errorMessage: 'Invalid "react-dom"',
                    errorDetails: 'expecting "1.0.1" to be "1.0.0" identical to "react" in "dependencies"',
                    dependency: {
                        name: "react-dom",
                        fieldName: "dependencies",
                        value: "1.0.1",
                    },
                    onlyWarns: undefined,
                },
                {
                    errorMessage: 'Invalid "react-test-renderer"',
                    errorDetails: 'expecting "1.0.1" to be "1.0.0" identical to "react" in "dependencies"',
                    dependency: {
                        name: "react-test-renderer",
                        fieldName: "devDependencies",
                        value: "1.0.1",
                    },
                    onlyWarns: undefined,
                },
            ]);
        });
    });
});
//# sourceMappingURL=checkIdenticalVersions.test.js.map