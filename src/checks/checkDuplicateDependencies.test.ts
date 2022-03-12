import { createReportError } from '../utils/createReportError';
import { createOnlyWarnsForArrayCheck } from '../utils/warnForUtils';
import { checkDuplicateDependencies } from './checkDuplicateDependencies';

jest.mock('../utils/createReportError', () => ({
  ...jest.requireActual('../utils/createReportError'),
  createReportError: jest.fn(),
}));

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkDuplicateDependencies', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });

  it('should report error when dependency does not intersect', () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: 'test',
        devDependencies: {
          rollup: '1.0.0',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'dependencies',
      ['devDependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^2.0.0' },
      },
      createOnlyWarnsForArrayCheck('test', []),
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" dependencies.',
      false,
    );
  });

  it('should not report error when dev dependency value is a beta', () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: 'test',
        devDependencies: {
          rollup: '1.0.0-beta.0',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'dependencies',
      ['devDependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^1.0.0-beta.0' },
      },
      createOnlyWarnsForArrayCheck('test', []),
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when dependency value is also a range', () => {
    checkDuplicateDependencies(
      mockReportError,
      {
        name: 'test',
        dependencies: {
          rollup: '^1.0.1',
        },
      },
      'dependencies',
      ['dependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^1.0.0' },
      },
      createOnlyWarnsForArrayCheck('test', []),
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
