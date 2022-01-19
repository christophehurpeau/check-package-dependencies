import { createReportError } from '../utils/createReportError';
import { checkDirectDuplicateDependencies } from './checkDirectDuplicateDependencies';

jest.mock('../utils/createReportError');

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkDirectDuplicateDependencies', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });

  it('should report error when dependency does not intersect', () => {
    checkDirectDuplicateDependencies(
      {
        name: 'test',
        devDependencies: {
          rollup: '1.0.0',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'path',
      'dependencies',
      ['devDependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^2.0.0' },
      },
    );
    expect(mockReportError).toHaveBeenCalledWith(
      'Invalid duplicate dependency "rollup"',
      '"1.0.0" (in devDependencies) should satisfies "^2.0.0" from "some-lib-using-rollup" dependencies.',
      false,
    );
  });

  it('should not report error when dev dependency value is a beta', () => {
    checkDirectDuplicateDependencies(
      {
        name: 'test',
        devDependencies: {
          rollup: '1.0.0-beta.0',
          'some-lib-using-rollup': '1.0.0',
        },
      },
      'path',
      'dependencies',
      ['devDependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^1.0.0-beta.0' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should not report error when dependency value is also a range', () => {
    checkDirectDuplicateDependencies(
      {
        name: 'test',
        dependencies: {
          rollup: '^1.0.1',
        },
      },
      'path',
      'dependencies',
      ['dependencies'],
      {
        name: 'some-lib-using-rollup',
        dependencies: { rollup: '^1.0.0' },
      },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });
});
