import assert from "node:assert/strict";
import { beforeEach, mock } from "node:test";
import type { Mock } from "node:test";
import type { ReportError, ReportErrorDetails } from "./ReportError.ts";

export interface CollectedMessages {
  path: string;
  ruleName: string;
  messages: ReportErrorDetails[];
}

export interface MockReportErrorResult {
  mockReportError: Mock<ReportError>;
  messages: CollectedMessages[];
}

export function createMockReportError(
  path = "test/path",
  ruleName = "Test Rule Name",
): MockReportErrorResult {
  const messages: CollectedMessages[] = [];

  const reportError = mock.fn<ReportError>((message) => {
    const currentPath = messages.find((m) => m.path === path);
    if (currentPath) {
      currentPath.messages.push(message);
    } else {
      messages.push({
        path,
        ruleName,
        messages: [message],
      });
    }
  });

  beforeEach(() => {
    messages.length = 0;
    reportError.mock.resetCalls();
  });

  return { mockReportError: reportError, messages };
}

export function assertNoMessages(messages: CollectedMessages[]): void {
  assert.equal(messages.length, 0);
}

export function assertSingleMessage(
  messages: CollectedMessages[],
  expected: ReportErrorDetails,
): void {
  assert.equal(messages.length, 1);
  assert.equal(messages[0].messages.length, 1);
  assert.deepEqual(
    messages[0].messages[0],
    !expected.dependency?.value
      ? expected
      : {
          ...expected,
          dependency: {
            changeValue: messages[0].messages[0]?.dependency?.changeValue,
            locations: messages[0].messages[0]?.dependency?.locations,
            ...expected.dependency,
          },
        },
  );
}

export function assertSeveralMessages(
  messages: CollectedMessages[],
  expected: ReportErrorDetails[],
): void {
  assert.equal(messages.length, 1);
  assert.deepEqual(
    messages[0].messages,
    expected.map((e, i) =>
      !e.dependency?.value
        ? e
        : {
            ...e,
            dependency: {
              changeValue: messages[0].messages[i].dependency?.changeValue,
              locations: messages[0].messages[i].dependency?.locations,
              ...e.dependency,
            },
          },
    ),
  );
}

export function assertDeepEqualIgnoringPrototypes(
  actual: unknown,
  expected: unknown,
): void {
  assert.deepEqual(
    JSON.parse(JSON.stringify(actual)),
    JSON.parse(JSON.stringify(expected)),
  );
}
