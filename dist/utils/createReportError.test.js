import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { createMockReportError } from "./createReportError.testUtils.js";
import { createReportError, displayMessages, logMessage, reportNotWarnedForMapping, resetMessages, } from "./createReportError.js";
import { createOnlyWarnsForMappingCheck } from "./warnForUtils.js";
afterEach(() => {
    process.exitCode = 0;
});
describe("logMessage", () => {
    beforeEach(() => {
        mock.reset();
        resetMessages();
    });
    test("it should display error with no info", () => {
        const errorFn = mock.method(console, "error", () => { });
        logMessage({ title: "test" });
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[31m❌ test\u001B[39m",
        ]);
    });
    test("it should display error with info", () => {
        const errorFn = mock.method(console, "error", () => { });
        logMessage({ title: "test", info: "info" });
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[31m❌ test\u001B[39m: info",
        ]);
    });
    test("it should display warning with no info", () => {
        const errorFn = mock.method(console, "error", () => { });
        logMessage({ title: "test", onlyWarns: true });
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[33m⚠ test\u001B[39m",
        ]);
    });
    test("it should display warning with info", () => {
        const errorFn = mock.method(console, "error", () => { });
        logMessage({ title: "test", info: "info", onlyWarns: true });
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[33m⚠ test\u001B[39m: info",
        ]);
    });
});
describe("reportNotWarnedForMapping", () => {
    const { mockReportError } = createMockReportError();
    beforeEach(() => {
        mock.reset();
        resetMessages();
    });
    test("it not report when warn is empty", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", []);
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 0);
    });
    test("it report when warn not empty as array", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
            "dep1",
        ]);
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
            title: 'Invalid config in "test"',
            info: 'no warning was raised for "dep1"',
            dependency: { name: "*" },
        });
    });
    test("it report when warn not empty as record with star", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
            "*": ["dep1"],
        });
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
            title: 'Invalid config in "test"',
            info: 'no warning was raised for "dep1"',
            dependency: { name: "*" },
        });
    });
    test("it report when warn not empty as record", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
            depKey: ["dep1"],
        });
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
            title: 'Invalid config in "test"',
            info: 'no warning was raised for "dep1"',
            dependency: { name: "depKey" },
        });
    });
});
describe("createReportError", () => {
    beforeEach(() => {
        mock.reset();
        resetMessages();
    });
    test("it should store general message", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({ title: "Error message" });
        const errorFn = mock.method(console, "error", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[36m== test/path ==\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[1].arguments, [
            "\u001B[36mTest Title\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[2].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
    });
    test("it should store dependency message", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({
            title: "Error message",
            dependency: { name: "dep1" },
        });
        const errorFn = mock.method(console, "error", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[36m== test/path ==\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[1].arguments, [
            "\u001B[36mIssues for dep1 in test/path:\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[2].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
    });
    test("it should set exit code for errors but not warnings", () => {
        const reportError = createReportError("Test Title", "test/path");
        process.exitCode = 0;
        reportError({ title: "Warning", onlyWarns: true });
        assert.equal(process.exitCode, 0);
        reportError({ title: "Error" });
        assert.equal(process.exitCode, 1);
    });
});
describe("displayMessages", () => {
    beforeEach(() => {
        mock.reset();
        resetMessages();
    });
    test("it should display nothing when no messages", () => {
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 0);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\n\u001B[32m✅ No errors or warnings found\u001B[39m.",
        ]);
    });
    test("it should display messages and conclusion with warnings", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({ title: "Warning", onlyWarns: true });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[33m1 warnings\u001B[39m.",
        ]);
    });
    test("it should display messages and conclusion with errors", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({ title: "Error" });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[31m1 errors\u001B[39m.",
        ]);
    });
    test("it should display messages and conclusion with auto-fixable errors", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({ title: "Error", autoFixable: true });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.equal(logFn.mock.calls.length, 2);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[31m1 errors\u001B[39m.",
        ]);
        assert.deepEqual(logFn.mock.calls[1].arguments, [
            'Found \u001B[32m1 auto-fixable\u001B[39m errors or warnings, run the command with "--fix" to fix them.',
        ]);
    });
    test("it should display messages and conclusion with both errors and warnings", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({ title: "Warning", onlyWarns: true });
        reportError({ title: "Error" });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 4);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[36m== test/path ==\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[1].arguments, [
            "\u001B[36mTest Title\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[2].arguments, [
            "\u001B[33m⚠ Test Title\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[3].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[31m1 errors\u001B[39m and \u001B[33m1 warnings\u001B[39m.",
        ]);
    });
    test("it should group multiple messages for same dependency", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({
            title: "First Error",
            dependency: { name: "dep1" },
        });
        reportError({
            title: "Second Error",
            dependency: { name: "dep1" },
        });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 4);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[36m== test/path ==\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[1].arguments, [
            "\u001B[36mIssues for dep1 in test/path:\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[2].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[3].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[31m2 errors\u001B[39m.",
        ]);
    });
    test("it should handle dependency with origin", () => {
        const reportError = createReportError("Test Title", "test/path");
        reportError({
            title: "Error",
            dependency: {
                name: "dep1",
                origin: "dependencies",
            },
        });
        const errorFn = mock.method(console, "error", () => { });
        const logFn = mock.method(console, "log", () => { });
        displayMessages();
        assert.equal(errorFn.mock.calls.length, 3);
        assert.deepEqual(errorFn.mock.calls[1].arguments, [
            "\u001B[36mIssues for dependencies : dep1 in test/path:\u001B[39m",
        ]);
        assert.deepEqual(errorFn.mock.calls[2].arguments, [
            "\u001B[31m❌ Test Title\u001B[39m",
        ]);
        assert.equal(logFn.mock.calls.length, 1);
        assert.deepEqual(logFn.mock.calls[0].arguments, [
            "\nFound \u001B[31m1 errors\u001B[39m.",
        ]);
    });
});
//# sourceMappingURL=createReportError.test.js.map