import assert from "node:assert/strict";
import { beforeEach, mock } from "node:test";
export function createMockReportError(path = "test/path", ruleName = "Test Rule Name") {
    const messages = [];
    const reportError = mock.fn((message) => {
        const currentPath = messages.find((m) => m.path === path);
        if (currentPath) {
            currentPath.messages.push(message);
        }
        else {
            messages.push({
                path,
                ruleName,
                messages: [message],
            });
        }
    });
    const createReportError = mock.fn((_title, _pkgPathName) => reportError);
    beforeEach(() => {
        messages.length = 0;
        reportError.mock.resetCalls();
        createReportError.mock.resetCalls();
    });
    return { mockReportError: reportError, createReportError, messages };
}
export function assertNoMessages(messages) {
    assert.equal(messages.length, 0);
}
export function assertSingleMessage(messages, expected) {
    assert.equal(messages.length, 1);
    assert.equal(messages[0].messages.length, 1);
    assert.deepEqual(messages[0].messages[0], !expected.dependency?.value
        ? expected
        : {
            ...expected,
            dependency: {
                changeValue: messages[0].messages[0]?.dependency?.changeValue,
                line: messages[0].messages[0]?.dependency?.line,
                column: messages[0].messages[0]?.dependency?.column,
                ...expected.dependency,
            },
        });
}
export function assertSeveralMessages(messages, expected) {
    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0].messages, expected.map((e, i) => !e.dependency?.value
        ? e
        : {
            ...e,
            dependency: {
                changeValue: messages[0].messages[i].dependency?.changeValue,
                line: messages[0].messages[i].dependency?.line,
                column: messages[0].messages[i].dependency?.column,
                ...e.dependency,
            },
        }));
}
export function assertCreateReportErrorCall(createReportError, expectedRuleName, expectedPath = "unknown_path") {
    assert.equal(createReportError.mock.calls.length, 1);
    assert.deepEqual(createReportError.mock.calls[0].arguments, [
        expectedRuleName,
        expectedPath,
    ]);
}
export function assertDeepEqualIgnoringPrototypes(actual, expected) {
    assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
}
//# sourceMappingURL=createReportError.testUtils.js.map