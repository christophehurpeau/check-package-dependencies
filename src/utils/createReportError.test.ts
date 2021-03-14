import { logMessage } from './createReportError';

describe('logMessage', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('it should display error with no info', () => {
    const errorFn = jest.spyOn(console, 'error').mockImplementation();
    logMessage('test');
    expect(errorFn).toMatchInlineSnapshot(`
      [MockFunction] {
        "calls": Array [
          Array [
            "[31m❌ test[39m",
          ],
        ],
        "results": Array [
          Object {
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
        "calls": Array [
          Array [
            "[31m❌ test[39m: info",
          ],
        ],
        "results": Array [
          Object {
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
        "calls": Array [
          Array [
            "[33m⚠ test[39m",
          ],
        ],
        "results": Array [
          Object {
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
        "calls": Array [
          Array [
            "[33m⚠ test[39m: info",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      }
    `);
  });
});
