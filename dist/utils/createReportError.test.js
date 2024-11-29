import assert from "node:assert/strict";
import { beforeEach, describe, mock, test } from "node:test";
import { createMockReportError } from "./createReportError.testUtils.js";
import { logMessage, reportNotWarnedForMapping } from "./createReportError.js";
import { createOnlyWarnsForMappingCheck } from "./warnForUtils.js";
beforeEach(() => {
    mock.reset();
});
describe("logMessage", () => {
    test("it should display error with no info", () => {
        const errorFn = mock.method(console, "error");
        logMessage("test");
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[31m❌ test\u001B[39m",
        ]);
    });
    test("it should display error with info", () => {
        const errorFn = mock.method(console, "error");
        logMessage("test", "info");
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[31m❌ test\u001B[39m: info",
        ]);
    });
    test("it should display warning with no info", () => {
        const errorFn = mock.method(console, "error");
        logMessage("test", undefined, true);
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[33m⚠ test\u001B[39m",
        ]);
    });
    test("it should display warning with info", () => {
        const errorFn = mock.method(console, "error");
        logMessage("test", "info", true);
        assert.equal(errorFn.mock.calls.length, 1);
        assert.deepEqual(errorFn.mock.calls[0].arguments, [
            "\u001B[33m⚠ test\u001B[39m: info",
        ]);
    });
});
describe("reportNotWarnedForMapping", () => {
    const { mockReportError } = createMockReportError();
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
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
            'Invalid config in "test" for "*"',
            'no warning was raised for "dep1"',
        ]);
    });
    test("it report when warn not empty as record with star", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
            "*": ["dep1"],
        });
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
            'Invalid config in "test" for "*"',
            'no warning was raised for "dep1"',
        ]);
    });
    test("it report when warn not empty as record", () => {
        const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
            depKey: ["dep1"],
        });
        reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
        assert.equal(mockReportError.mock.calls.length, 1);
        assert.deepEqual(mockReportError.mock.calls[0].arguments, [
            'Invalid config in "test" for "depKey"',
            'no warning was raised for "dep1"',
        ]);
    });
});
//# sourceMappingURL=createReportError.test.js.map