import { createReportError } from '../utils/createReportError';
import { checkExactVersions } from './checkExactVersions';

jest.mock('../utils/createReportError');

const mockReportError = jest.fn();
(createReportError as ReturnType<typeof jest.fn>).mockReturnValue(
  mockReportError,
);

describe('checkExactVersions', () => {
  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when all versions are exact', () => {
    checkExactVersions(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
      'devDependencies',
    );
    expect(createReportError).toHaveBeenCalledWith('Exact versions', 'path');
    expect(mockReportError).not.toHaveBeenCalled();
  });
  it('should return an error when one version has a caret range', () => {
    checkExactVersions(
      { name: 'test', devDependencies: { test: '^1.0.0' } },
      'path',
      'devDependencies',
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      false,
    );
  });
  it('should return an warning when one version has a caret range and is in onlyWarnsFor', () => {
    checkExactVersions(
      { name: 'test', devDependencies: { test: '^1.0.0' } },
      'path',
      'devDependencies',
      { onlyWarnsFor: ['test'] },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      true,
    );
  });

  it('should return an error when one version has a tilde range', () => {
    checkExactVersions(
      { name: 'test', devDependencies: { test: '~1.0.0' } },
      'path',
      'devDependencies',
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
    );
  });

  it('should return multiple errors when multiple versions have range', () => {
    checkExactVersions(
      { name: 'test', devDependencies: { test1: '~1.0.0', test2: '~1.0.0' } },
      'path',
      'devDependencies',
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(2);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      2,
      'Unexpected range dependency in "devDependencies" for "test2"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
    );
    expect(mockReportError);
  });
});
