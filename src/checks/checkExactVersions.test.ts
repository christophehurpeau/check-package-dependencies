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
  });

  it('should fix and remove range', () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockReturnValueOnce({ name: 'test1', version: '1.0.1' });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    checkExactVersions(pkg, 'path', 'devDependencies', {
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(0);
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(pkg).toStrictEqual({
      name: 'test',
      devDependencies: { test1: '1.0.1' },
    });
  });

  it('should error if autofix failed as package does not exists', () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('Module not found');
      });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    checkExactVersions(pkg, 'path', 'devDependencies', {
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed to resolve "test1".',
      false,
    );
  });

  it("should error if autofix failed because version doesn't match range", () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockReturnValueOnce({ name: 'test1', version: '2.0.0' });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    checkExactVersions(pkg, 'path', 'devDependencies', {
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed as "test1"\'s resolved version is "2.0.0" and doesn\'t satisfies "~1.0.0".',
      false,
    );
  });

  it('should support npm: prefix', () => {
    checkExactVersions(
      {
        name: 'test',
        devDependencies: {
          rollupv1: 'npm:rollup@^1.0.1',
        },
      },
      'path',
      'devDependencies',
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "rollupv1"',
      'expecting "^1.0.1" to be exact "1.0.1".',
      false,
    );
  });
});
