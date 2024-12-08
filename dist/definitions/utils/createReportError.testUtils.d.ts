import type { Mock } from "node:test";
import type { Except } from "type-fest";
import type { ReportError, ReportErrorMessage } from "./createReportError.ts";
export interface CollectedMessages {
    path: string;
    ruleName: string;
    messages: Except<ReportErrorMessage, "ruleName">[];
}
export interface MockReportErrorResult {
    mockReportError: Mock<ReportError>;
    createReportError: Mock<(ruleName: string, pkgPathName: string) => ReportError>;
    messages: CollectedMessages[];
}
export declare function createMockReportError(path?: string, ruleName?: string): MockReportErrorResult;
export declare function assertNoMessages(messages: CollectedMessages[]): void;
export declare function assertSingleMessage(messages: CollectedMessages[], expected: Except<ReportErrorMessage, "ruleName">): void;
export declare function assertSeveralMessages(messages: CollectedMessages[], expected: Except<ReportErrorMessage, "ruleName">[]): void;
export declare function assertCreateReportErrorCall(createReportError: Mock<(ruleName: string, pkgPathName: string) => ReportError>, expectedRuleName: string, expectedPath?: string): void;
export declare function assertDeepEqualIgnoringPrototypes(actual: unknown, expected: unknown): void;
//# sourceMappingURL=createReportError.testUtils.d.ts.map