import type { Mock } from "node:test";
import type { ReportError, ReportErrorMessage } from "./ReportError.ts";
export interface CollectedMessages {
    path: string;
    ruleName: string;
    messages: ReportErrorMessage[];
}
export interface MockReportErrorResult {
    mockReportError: Mock<ReportError>;
    messages: CollectedMessages[];
}
export declare function createMockReportError(path?: string, ruleName?: string): MockReportErrorResult;
export declare function assertNoMessages(messages: CollectedMessages[]): void;
export declare function assertSingleMessage(messages: CollectedMessages[], expected: ReportErrorMessage): void;
export declare function assertSeveralMessages(messages: CollectedMessages[], expected: ReportErrorMessage[]): void;
export declare function assertDeepEqualIgnoringPrototypes(actual: unknown, expected: unknown): void;
//# sourceMappingURL=ReportError.testUtils.d.ts.map