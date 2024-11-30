import { describe, it } from "node:test";
import { assertCreateReportErrorCall, assertNoMessages, assertSeveralMessages, assertSingleMessage, createMockReportError, } from "../utils/createReportError.testUtils.js";
import { checkIdenticalVersions } from "./checkIdenticalVersions.js";
describe("checkIdenticalVersions", () => {
    const { createReportError, messages } = createMockReportError();
    describe("devDependencies in array", () => {
        it("should return no error when all versions are identical", () => {
            checkIdenticalVersions({
                name: "test",
                devDependencies: { react: "1.0.0", "react-dom": "1.0.0" },
            }, "path", "devDependencies", {
                react: ["react-dom"],
            }, undefined, createReportError);
            assertCreateReportErrorCall(createReportError, "Identical Versions", "path");
            assertNoMessages(messages);
        });
        it("should return error when versions are not identical", () => {
            checkIdenticalVersions({
                name: "test",
                devDependencies: { react: "1.0.0", "react-dom": "1.0.1" },
            }, "path", "devDependencies", {
                react: ["react-dom"],
            }, undefined, createReportError);
            assertCreateReportErrorCall(createReportError, "Identical Versions", "path");
            assertSingleMessage(messages, {
                title: 'Invalid "react-dom"',
                info: 'expecting "1.0.1" to be "1.0.0"',
                dependency: { name: "react", origin: "devDependencies" },
                onlyWarns: undefined,
            });
        });
    });
    describe("object with dependencies and devDependencies", () => {
        it("should return no error when all versions are identical", () => {
            checkIdenticalVersions({
                name: "test",
                dependencies: { react: "1.0.0", "react-dom": "1.0.0" },
                devDependencies: { "react-test-renderer": "1.0.0" },
            }, "path", "dependencies", {
                react: {
                    dependencies: ["react-dom"],
                    devDependencies: ["react-test-renderer"],
                },
            }, undefined, createReportError);
            assertCreateReportErrorCall(createReportError, "Identical Versions", "path");
            assertNoMessages(messages);
        });
        it("should return error when versions are not identical", () => {
            checkIdenticalVersions({
                name: "test",
                dependencies: { react: "1.0.0", "react-dom": "1.0.1" },
                devDependencies: { "react-test-renderer": "1.0.1" },
            }, "path", "dependencies", {
                react: {
                    dependencies: ["react-dom"],
                    devDependencies: ["react-test-renderer"],
                },
            }, undefined, createReportError);
            assertCreateReportErrorCall(createReportError, "Identical Versions", "path");
            assertSeveralMessages(messages, [
                {
                    title: 'Invalid "react-dom"',
                    info: 'expecting "1.0.1" to be "1.0.0"',
                    dependency: { name: "react", origin: "dependencies" },
                    onlyWarns: undefined,
                },
                {
                    title: 'Invalid "react-test-renderer"',
                    info: 'expecting "1.0.1" to be "1.0.0"',
                    dependency: { name: "react", origin: "devDependencies" },
                    onlyWarns: undefined,
                },
            ]);
        });
    });
});
//# sourceMappingURL=checkIdenticalVersions.test.js.map