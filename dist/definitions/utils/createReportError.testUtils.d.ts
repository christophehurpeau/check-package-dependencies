import type { Mock } from "node:test";
import type { ReportError } from "./createReportError.ts";
type MockReportError = Mock<ReportError>;
type MockCreateReportError = Mock<() => ReportError>;
export declare function createMockReportError(): {
    mockReportError: MockReportError;
    createReportError: MockCreateReportError;
};
export {};
//# sourceMappingURL=createReportError.testUtils.d.ts.map