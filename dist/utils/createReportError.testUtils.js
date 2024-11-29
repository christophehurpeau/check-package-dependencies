import { beforeEach, mock } from "node:test";
export function createMockReportError() {
    const mockReportError = mock.fn();
    const createReportError = mock.fn(() => mockReportError);
    beforeEach(() => {
        mockReportError.mock.resetCalls();
        createReportError.mock.resetCalls();
    });
    return { mockReportError, createReportError };
}
//# sourceMappingURL=createReportError.testUtils.js.map