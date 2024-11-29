import { beforeEach, mock } from "node:test";
import type { Mock } from "node:test";
import type { ReportError } from "./createReportError.ts";

type MockReportError = Mock<ReportError>;
type MockCreateReportError = Mock<() => ReportError>;

export function createMockReportError(): {
  mockReportError: MockReportError;
  createReportError: MockCreateReportError;
} {
  const mockReportError = mock.fn() as unknown as MockReportError;
  const createReportError = mock.fn(
    () => mockReportError,
  ) as unknown as MockCreateReportError;

  beforeEach(() => {
    mockReportError.mock.resetCalls();
    createReportError.mock.resetCalls();
  });
  return { mockReportError, createReportError };
}
