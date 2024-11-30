import assert from "node:assert/strict";
import { beforeEach, mock } from "node:test";
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

export function createMockReportError(
  path = "test/path",
  title = "Test Title",
): MockReportErrorResult {
  const messages: CollectedMessages[] = [];

  const reportError = mock.fn((message: ReportErrorMessage) => {
    const currentPath = messages.find((m) => m.path === path);
    if (currentPath) {
      currentPath.messages.push(message);
    } else {
      messages.push({
        path,
        title,
        messages: [message],
      });
    }
  });

  const createReportError = mock.fn(
    (_title: string, _pkgPathName: string) => reportError,
  );

  beforeEach(() => {
    messages.length = 0;
    reportError.mock.resetCalls();
    createReportError.mock.resetCalls();
  });

  return { mockReportError: reportError, createReportError, messages };
}

export function assertNoMessages(messages: CollectedMessages[]): void {
  assert.equal(messages.length, 0);
}

export function assertSingleMessage(
  messages: CollectedMessages[],
  expected: ReportErrorMessage,
): void {
  assert.equal(messages.length, 1);
  assert.equal(messages[0].messages.length, 1);
  assert.deepEqual(messages[0].messages[0], expected);
}

export function assertSeveralMessages(
  messages: CollectedMessages[],
  expected: ReportErrorMessage[],
): void {
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].messages, expected);
}

export function assertCreateReportErrorCall(
  createReportError: Mock<(title: string, pkgPathName: string) => ReportError>,
  expectedTitle: string,
  expectedPath: string,
): void {
  assert.equal(createReportError.mock.calls.length, 1);
  assert.deepEqual(createReportError.mock.calls[0].arguments, [
    expectedTitle,
    expectedPath,
  ]);
}
