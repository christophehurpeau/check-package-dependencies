import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, mock, test } from "node:test";
import { createMockReportError } from "./createReportError.testUtils.ts";
import {
  createReportError,
  displayMessages,
  logMessage,
  reportNotWarnedForMapping,
  resetMessages,
} from "./createReportError.ts";
import { createOnlyWarnsForMappingCheck } from "./warnForUtils.ts";

afterEach(() => {
  process.exitCode = 0;
});

describe("logMessage", () => {
  beforeEach(() => {
    mock.reset();
    resetMessages();
  });

  test("it should display error with no info", () => {
    const errorFn = mock.method(console, "error", () => {});
    logMessage({ ruleName: "rule-test", errorMessage: "test" });
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "  0:0  \u001B[31merror\u001B[39m  \u001B[31mtest\u001B[39m  \u001B[34mrule-test\u001B[39m",
    ]);
  });

  test("it should display error with info", () => {
    const errorFn = mock.method(console, "error", () => {});
    logMessage({
      ruleName: "rule-test",
      errorMessage: "test",
      errorDetails: "info",
    });
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "  0:0  \u001B[31merror\u001B[39m  \u001B[31mtest\u001B[39m: info  \u001B[34mrule-test\u001B[39m",
    ]);
  });

  test("it should display warning with no info", () => {
    const errorFn = mock.method(console, "error", () => {});
    logMessage({
      ruleName: "rule-test",
      errorMessage: "test",
      onlyWarns: true,
    });
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "  0:0  \u001B[33mwarning\u001B[39m  \u001B[33mtest\u001B[39m  \u001B[34mrule-test\u001B[39m",
    ]);
  });

  test("it should display warning with info", () => {
    const errorFn = mock.method(console, "error", () => {});
    logMessage({
      ruleName: "rule-test",
      errorMessage: "test",
      errorDetails: "info",
      onlyWarns: true,
    });
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "  0:0  \u001B[33mwarning\u001B[39m  \u001B[33mtest\u001B[39m: info  \u001B[34mrule-test\u001B[39m",
    ]);
  });
});

describe("reportNotWarnedForMapping", () => {
  const { mockReportError } = createMockReportError();

  beforeEach(() => {
    mock.reset();
    resetMessages();
  });

  test("it not report when warn is empty", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", []);
    reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
    assert.equal(mockReportError.mock.calls.length, 0);
  });

  test("it report when warn not empty as array", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", [
      "dep1",
    ]);
    reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
      errorMessage: 'Invalid config in "test"',
      errorDetails: 'no warning was raised for "dep1"',
    });
  });

  test("it report when warn not empty as record with star", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      "*": ["dep1"],
    });
    reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
      errorMessage: 'Invalid config in "test"',
      errorDetails: 'no warning was raised for "dep1"',
    });
  });

  test("it report when warn not empty as record", () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck("test", {
      depKey: ["dep1"],
    });
    reportNotWarnedForMapping(mockReportError, onlyWarnsForMappingCheck);
    assert.equal(mockReportError.mock.calls.length, 1);
    assert.deepEqual(mockReportError.mock.calls[0].arguments[0], {
      errorMessage: 'Invalid config in "test"',
      errorDetails: 'no warning was raised for "dep1"',
    });
  });
});

describe("createReportError", () => {
  beforeEach(() => {
    mock.reset();
    resetMessages();
  });

  test("it should store general message", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "Error message",
    });

    const errorFn = mock.method(console, "error", () => {});
    displayMessages();

    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "\u001B[4mtest/path\u001B[24m",
    ]);
    assert.deepEqual(errorFn.mock.calls[1].arguments, [
      "  0:0  \u001B[31merror\u001B[39m  \u001B[31mError message\u001B[39m  \u001B[34mTest Title\u001B[39m",
    ]);
  });

  test("it should store dependency message with location", () => {
    const reportError = createReportError("test-rule", "test/path");
    reportError({
      errorMessage: "Error message",
      dependency: {
        name: "dep1",
        line: 42,
        column: 10,
      },
    });

    const errorFn = mock.method(console, "error", () => {});
    displayMessages();

    assert.equal(errorFn.mock.calls.length, 3);
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "\u001B[4mtest/path\u001B[24m",
    ]);
    assert.deepEqual(errorFn.mock.calls[1].arguments, [
      "  42:10  \u001B[31merror\u001B[39m  \u001B[90mdep1 \u001B[39m\u001B[31mError message\u001B[39m  \u001B[34mtest-rule\u001B[39m",
    ]);
  });

  test("it should handle dependency with type", () => {
    const reportError = createReportError("test-rule", "test/path");
    reportError({
      errorMessage: "Error message",
      dependency: {
        name: "dep1",
        fieldName: "dependencies",
        line: 15,
        column: 5,
      },
    });

    const errorFn = mock.method(console, "error", () => {});
    displayMessages();

    assert.equal(errorFn.mock.calls.length, 3);
    assert.deepEqual(errorFn.mock.calls[1].arguments, [
      "  15:5  \u001B[31merror\u001B[39m  \u001B[90mdependencies > dep1 \u001B[39m\u001B[31mError message\u001B[39m  \u001B[34mtest-rule\u001B[39m",
    ]);
  });

  test("it should set exit code for errors but not warnings", () => {
    const reportError = createReportError("Test Title", "test/path");

    process.exitCode = 0;
    reportError({
      errorMessage: "Warning",
      onlyWarns: true,
    });
    assert.equal(process.exitCode, 0);

    reportError({
      errorMessage: "Error",
    });
    assert.equal(process.exitCode, 1);
  });
});

describe("displayMessages", () => {
  beforeEach(() => {
    mock.reset();
    resetMessages();
  });

  test("it should display nothing when no messages", () => {
    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(errorFn.mock.calls.length, 0);
    assert.equal(logFn.mock.calls.length, 1);
    assert.deepEqual(logFn.mock.calls[0].arguments, [
      "\u001B[32m\u001B[39m\n\u001B[32m✨ No problems found\u001B[39m",
    ]);
  });

  test("it should display messages and conclusion with warnings", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "Warning",
      onlyWarns: true,
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(errorFn.mock.calls.length, 3);
    assert.equal(logFn.mock.calls.length, 1);
    assert.deepEqual(logFn.mock.calls[0].arguments, [
      "\n✖ Found \u001B[33m1 warning\u001B[39m",
    ]);
  });

  test("it should display messages and conclusion with errors", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "Error",
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(errorFn.mock.calls.length, 3);
    assert.equal(logFn.mock.calls.length, 1);
    assert.deepEqual(logFn.mock.calls[0].arguments, [
      "\n✖ Found \u001B[31m1 error\u001B[39m",
    ]);
  });

  test("it should display messages and conclusion with auto-fixable errors", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "Error",
      autoFixable: true,
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(errorFn.mock.calls.length, 3);
    assert.equal(logFn.mock.calls.length, 2);

    assert.deepEqual(
      logFn.mock.calls.map((call) => call.arguments),
      [
        ["\n✖ Found \u001B[31m1 error\u001B[39m"],
        [
          "\u001B[90m\u001B[39m\n\u001B[90m1 issue fixable with the --fix option\u001B[39m",
        ],
      ],
    );
  });

  test("it should display messages and conclusion with both errors and warnings", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "Warning",
      onlyWarns: true,
    });
    reportError({
      errorMessage: "Error",
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(errorFn.mock.calls.length, 4);
    assert.equal(logFn.mock.calls.length, 1);
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "\u001B[4mtest/path\u001B[24m",
    ]);
    assert.deepEqual(errorFn.mock.calls[1].arguments, [
      "  0:0  \u001B[33mwarning\u001B[39m  \u001B[33mWarning\u001B[39m  \u001B[34mTest Title\u001B[39m",
    ]);
  });

  test("it should group multiple messages for same dependency", () => {
    const reportError = createReportError("Test Title", "test/path");
    reportError({
      errorMessage: "First Error",
      dependency: { name: "dep1" },
    });
    reportError({
      errorMessage: "Second Error",
      dependency: { name: "dep1" },
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(logFn.mock.calls.length, 1);
    assert.equal(errorFn.mock.calls.length, 4);
    assert.deepEqual(errorFn.mock.calls[0].arguments, [
      "\u001B[4mtest/path\u001B[24m",
    ]);
    assert.deepEqual(errorFn.mock.calls[1].arguments, [
      "  0:0  \u001B[31merror\u001B[39m  \u001B[90mdep1 \u001B[39m\u001B[31mFirst Error\u001B[39m  \u001B[34mTest Title\u001B[39m",
    ]);
    assert.deepEqual(errorFn.mock.calls[2].arguments, [
      "  0:0  \u001B[31merror\u001B[39m  \u001B[90mdep1 \u001B[39m\u001B[31mSecond Error\u001B[39m  \u001B[34mTest Title\u001B[39m",
    ]);
    assert.deepEqual(errorFn.mock.calls[3].arguments, []);
    assert.deepEqual(logFn.mock.calls[0].arguments, [
      "\n✖ Found \u001B[31m2 errors\u001B[39m",
    ]);
  });

  test("it should handle dependency with origin", () => {
    const reportError = createReportError("test-rule", "test/path");
    reportError({
      errorMessage: "Error",
      dependency: {
        name: "dep1",
        fieldName: "dependencies",
        line: 15,
        column: 5,
      },
    });

    const errorFn = mock.method(console, "error", () => {});
    const logFn = mock.method(console, "log", () => {});

    displayMessages();

    assert.equal(logFn.mock.calls.length, 1);
    assert.equal(errorFn.mock.calls.length, 3);

    assert.deepEqual(logFn.mock.calls[0].arguments, [
      "\n✖ Found \u001B[31m1 error\u001B[39m",
    ]);

    assert.deepEqual(
      errorFn.mock.calls.map((call) => call.arguments),
      [
        ["\u001B[4mtest/path\u001B[24m"],
        [
          "  15:5  \u001B[31merror\u001B[39m  \u001B[90mdependencies > dep1 \u001B[39m\u001B[31mError\u001B[39m  \u001B[34mtest-rule\u001B[39m",
        ],
        [],
      ],
    );
  });
});
