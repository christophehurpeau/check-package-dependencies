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
  assert.deepStrictEqual(messages, []);
}

export function assertSingleMessage(
  messages: CollectedMessages[],
  expected: ReportErrorDetails,
): void {
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.messages.length, 1);
  assert.deepEqual(
    messages[0].messages[0],
    !expected.dependency?.value
      ? expected
      : {
          ...expected,
          dependency: {
            changeValue: messages[0].messages[0]?.dependency?.changeValue,
            toString: messages[0].messages[0]?.dependency?.toString,
            locations: messages[0].messages[0]?.dependency?.locations,
            ranges: messages[0].messages[0]?.dependency?.ranges,
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

  // this first assertion makes checks more readable
  assert.deepEqual(
    messages[0]?.messages.map((m) => {
      if (!m.dependency?.value) {
        return m;
      }
      const dependency = { ...m.dependency };
      delete dependency.changeValue;
      delete dependency.toString;
      delete dependency.locations;
      delete dependency.ranges;
      const suggestions = m.suggestions?.map((s) => {
        const suggestionDependency = { ...s[0] };
        delete suggestionDependency.changeValue;
        delete suggestionDependency.toString;
        delete suggestionDependency.locations;
        delete suggestionDependency.ranges;
        return [suggestionDependency, s[1], s[2]];
      });
      return suggestions
        ? { ...m, dependency, suggestions }
        : { ...m, dependency };
    }),
    expected,
  );

  // assert.deepEqual(
  //   messages[0].messages,
  //   expected.map((e, i) =>
  //     !e.dependency?.value
  //       ? e
  //       : {
  //           ...e,
  //           dependency: {
  //             changeValue: messages[0].messages[i]?.dependency?.changeValue,
  //             toString: messages[0].messages[i]?.dependency?.toString,
  //             locations: messages[0].messages[i]?.dependency?.locations,
  //             ranges: messages[0].messages[i]?.dependency?.ranges,
  //             ...e.dependency,
  //           },
  //           suggestions: e.suggestions
  //             ? e.suggestions.map((s, i) => [
  //                 {
  //                   ...s[0],
  //                   changeValue: messages[0].messages[i]?.suggestions?.[i]?.[1],
  //                   toString: messages[0].messages[i]?.suggestions?.[i]?.[1],
  //                   locations: messages[0].messages[i]?.suggestions?.[i]?.[1],
  //                   ranges: messages[0].messages[i]?.suggestions?.[i]?.[1],
  //                 },
  //                 s[1],
  //                 s[2],
  //               ])
  //             : undefined,
  //         },
  //   ),
  // );
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
