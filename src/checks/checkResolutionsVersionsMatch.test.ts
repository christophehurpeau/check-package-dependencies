import { createReportError } from '../utils/createReportError';
import { checkResolutionsVersionsMatch } from './checkResolutionsVersionsMatch';

jest.mock('../utils/createReportError', () => ({
  ...jest.requireActual('../utils/createReportError'),
  createReportError: jest.fn(),
}));

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkResolutionsVersionsMatch', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when no "resolutions" is present', () => {
    checkResolutionsVersionsMatch(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return no error when "resolutions" has dependency not in other dependencies type', () => {
    checkResolutionsVersionsMatch(
      { name: 'test', resolutions: { test: '1.0.0' } },
      'path',
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return no error when "resolutions" has dependency matching', () => {
    checkResolutionsVersionsMatch(
      {
        name: 'test',
        resolutions: { test1: '1.0.0', test2: '1.0.0', test3: '1.0.1' },
        devDependencies: { test1: '1.0.0' },
        dependencies: { test2: '1.0.0', test3: '^1.0.0' },
      },
      'path',
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('should return error when "resolutions" has dependency not matching', () => {
    checkResolutionsVersionsMatch(
      {
        name: 'test',
        resolutions: { test1: '1.0.0', test2: '1.0.0' },
        devDependencies: { test1: '1.1.0' },
        dependencies: { test2: '1.2.0' },
      },
      'path',
    );
    expect(mockReportError).toHaveBeenCalledTimes(2);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Invalid "test1" in devDependencies',
      'expecting "1.1.0" be "1.0.0" from resolutions.',
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      2,
      'Invalid "test2" in dependencies',
      'expecting "1.2.0" be "1.0.0" from resolutions.',
    );
  });

  it('should fix without error when "resolutions" has dependency not matching', () => {
    const pkg = {
      name: 'test',
      resolutions: { test1: '1.0.0', test2: '1.0.0' },
      devDependencies: { test1: '1.1.0' },
      dependencies: { test2: '1.2.0' },
    };
    checkResolutionsVersionsMatch(pkg, 'path', { tryToAutoFix: true });

    expect(mockReportError).toHaveBeenCalledTimes(0);
    expect(pkg.devDependencies.test1).toBe('1.0.0');
    expect(pkg.dependencies.test2).toBe('1.0.0');
  });
});