import type { Mock } from "node:test";
import type { ReportError, ReportErrorMessage } from "./createReportError.ts";
export interface CollectedMessages {
    path: string;
    title: string;
    messages: ReportErrorMessage[];
}
export interface MockReportErrorResult {
    mockReportError: Mock<ReportError>;
    createReportError: Mock<(title: string, pkgPathName: string) => ReportError>;
    messages: CollectedMessages[];
}
export declare function createMockReportError(path?: string, title?: string): MockReportErrorResult;
export declare function assertNoMessages(messages: CollectedMessages[]): void;
export declare function assertSingleMessage(messages: CollectedMessages[], expected: ReportErrorMessage): void;
export declare function assertSeveralMessages(messages: CollectedMessages[], expected: ReportErrorMessage[]): void;
export declare function assertCreateReportErrorCall(createReportError: Mock<(title: string, pkgPathName: string) => ReportError>, expectedTitle: string, expectedPath: string): void;
//# sourceMappingURL=createReportError.testUtils.d.ts.map