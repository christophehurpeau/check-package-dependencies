import { logMessage, reportNotWarnedForMapping } from './createReportError';
import { createOnlyWarnsForMappingCheck } from './warnForUtils';

describe('logMessage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('it should display error with no info', () => {
    const errorFn = jest.spyOn(console, 'error').mockImplementation();
    logMessage('test');
    expect(errorFn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "[31m❌ test[39m",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });
  test('it should display error with info', () => {
    const errorFn = jest.spyOn(console, 'error').mockImplementation();
    logMessage('test', 'info');
    expect(errorFn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "[31m❌ test[39m: info",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  test('it should display warning with no info', () => {
    const errorFn = jest.spyOn(console, 'error').mockImplementation();
    logMessage('test', undefined, true);
    expect(errorFn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "[33m⚠ test[39m",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });

  test('it should display warning with info', () => {
    const errorFn = jest.spyOn(console, 'error').mockImplementation();
    logMessage('test', 'info', true);
    expect(errorFn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": [
          [
            "[33m⚠ test[39m: info",
          ],
        ],
        "results": [
          {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });
});

describe('reportNotWarnedForMapping', () => {
  const reportError = jest.fn();
  beforeEach(() => {
    reportError.mockReset();
  });

  test('it not report when warn is empty', () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck('test', []);
    reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck);
    expect(reportError).not.toHaveBeenCalled();
  });

  test('it report when warn not empty as array', () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck('test', [
      'dep1',
    ]);
    reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenLastCalledWith(
      'Invalid config in "test" for "*"',
      'no warning was raised for "dep1"',
    );
  });

  test('it report when warn not empty as record with star', () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck('test', {
      '*': ['dep1'],
    });
    reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenLastCalledWith(
      'Invalid config in "test" for "*"',
      'no warning was raised for "dep1"',
    );
  });

  test('it report when warn not empty as record', () => {
    const onlyWarnsForMappingCheck = createOnlyWarnsForMappingCheck('test', {
      depKey: ['dep1'],
    });
    reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck);
    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenLastCalledWith(
      'Invalid config in "test" for "depKey"',
      'no warning was raised for "dep1"',
    );
  });
});
