import assert from "node:assert/strict";
import { beforeEach, mock } from "node:test";
export function createMockReportError(path = "test/path", title = "Test Title") {
    const messages = [];
    const reportError = mock.fn((message) => {
        const currentPath = messages.find((m) => m.path === path);
        if (currentPath) {
            currentPath.messages.push(message);
        }
        else {
            messages.push({
                path,
                title,
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
    assert.deepEqual(messages[0].messages[0], expected);
}
export function assertSeveralMessages(messages, expected) {
    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0].messages, expected);
}
export function assertCreateReportErrorCall(createReportError, expectedTitle, expectedPath) {
    assert.equal(createReportError.mock.calls.length, 1);
    assert.deepEqual(createReportError.mock.calls[0].arguments, [
        expectedTitle,
        expectedPath,
    ]);
}
//# sourceMappingURL=createReportError.testUtils.js.map