import { createOnlyWarnsForArrayCheck } from '../utils/warnForUtils';
import { checkExactVersions } from './checkExactVersions';

const jest = import.meta.jest;

const onlyWarnsForConfigName = 'checkExactVersions.test.onlyWarnsFor';
const emptyOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
  onlyWarnsForConfigName,
  [],
);

describe('checkExactVersions', () => {
  const mockReportError = jest.fn();
  const createReportError = jest.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when all versions are exact', async () => {
    await checkExactVersions(
      { name: 'test', devDependencies: { test: '1.0.0' } },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalledWith('Exact versions', 'path');
    expect(mockReportError).not.toHaveBeenCalled();
  });
  it('should return an error when one version has a caret range', async () => {
    await checkExactVersions(
      { name: 'test', devDependencies: { test: '^1.0.0' } },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      false,
      false,
    );
  });
  it.each(['<', '<=', '>', '>='])(
    'should return an error when one version has a comparator "%s" range',
    async (comparator) => {
      await checkExactVersions(
        { name: 'test', devDependencies: { test: `${comparator}1.0.0` } },
        'path',
        ['devDependencies'],
        {
          onlyWarnsForCheck: emptyOnlyWarnsForCheck,
          customCreateReportError: createReportError,
        },
      );
      expect(createReportError).toHaveBeenCalled();
      expect(mockReportError).toHaveBeenCalledTimes(1);
      expect(mockReportError).toHaveBeenCalledWith(
        'Unexpected range dependency in "devDependencies" for "test"',
        `expecting "${comparator}1.0.0" to be exact "1.0.0".`,
        false,
        false,
      );
    },
  );
  it('should return an warning when one version has a caret range and is in onlyWarnsFor', async () => {
    await checkExactVersions(
      { name: 'test', devDependencies: { test: '^1.0.0' } },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ['test'],
        ),
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "^1.0.0" to be exact "1.0.0".',
      true,
      false,
    );
  });

  it('should return an error when one version has a tilde range', async () => {
    await checkExactVersions(
      { name: 'test', devDependencies: { test: '~1.0.0' } },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenCalledWith(
      'Unexpected range dependency in "devDependencies" for "test"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    );
  });

  it('should return multiple errors when multiple versions have range', async () => {
    await checkExactVersions(
      {
        name: 'test',
        devDependencies: {
          test1: '~1.0.0',
          test2: '~1.0.0',
          test3: '^18',
          test4: '^18.1',
        },
      },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(4);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      2,
      'Unexpected range dependency in "devDependencies" for "test2"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      3,
      'Unexpected range dependency in "devDependencies" for "test3"',
      'expecting "^18" to be exact "18.0.0".',
      false,
      false,
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      4,
      'Unexpected range dependency in "devDependencies" for "test4"',
      'expecting "^18.1" to be exact "18.1.0".',
      false,
      false,
    );
  });

  it('should fix and remove range', async () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockReturnValueOnce({ name: 'test1', version: '1.0.1' });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    await checkExactVersions(pkg, 'path', ['devDependencies'], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(0);
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(pkg).toStrictEqual({
      name: 'test',
      devDependencies: { test1: '1.0.1' },
    });
  });

  it('should error if autofix failed as package does not exists', async () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('Module not found');
      });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    await checkExactVersions(pkg, 'path', ['devDependencies'], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed to resolve "test1".',
      false,
      false,
    );
  });

  it("should error if autofix failed because version doesn't match range", async () => {
    const getDependencyPackageJsonMock = jest
      .fn()
      .mockReturnValueOnce({ name: 'test1', version: '2.0.0' });
    const pkg = { name: 'test', devDependencies: { test1: '~1.0.0' } };
    await checkExactVersions(pkg, 'path', ['devDependencies'], {
      onlyWarnsForCheck: emptyOnlyWarnsForCheck,
      tryToAutoFix: true,
      getDependencyPackageJson: getDependencyPackageJsonMock,
      customCreateReportError: createReportError,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(getDependencyPackageJsonMock).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact, autofix failed as "test1"\'s resolved version is "2.0.0" and doesn\'t satisfies "~1.0.0".',
      false,
      false,
    );
  });

  it('should support npm: prefix', async () => {
    await checkExactVersions(
      {
        name: 'test',
        devDependencies: {
          rollupv1: 'npm:rollup@^1.0.1',
        },
      },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: emptyOnlyWarnsForCheck,
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "rollupv1"',
      'expecting "^1.0.1" to be exact "1.0.1".',
      false,
      false,
    );
  });
  it('should warn when onlyWarnsFor is passed', async () => {
    await checkExactVersions(
      { name: 'test', devDependencies: { test1: '~1.0.0', test2: '~1.0.0' } },
      'path',
      ['devDependencies'],
      {
        onlyWarnsForCheck: createOnlyWarnsForArrayCheck(
          onlyWarnsForConfigName,
          ['test1'],
        ),
        customCreateReportError: createReportError,
      },
    );
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(2);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Unexpected range dependency in "devDependencies" for "test1"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      true,
      false,
    );
    expect(mockReportError).toHaveBeenNthCalledWith(
      2,
      'Unexpected range dependency in "devDependencies" for "test2"',
      'expecting "~1.0.0" to be exact "1.0.0".',
      false,
      false,
    );
  });
  it('should error when onlyWarnsFor is not fully used', async () => {
    await checkExactVersions({ name: 'test' }, 'path', ['devDependencies'], {
      onlyWarnsForCheck: createOnlyWarnsForArrayCheck(onlyWarnsForConfigName, [
        'testa',
      ]),
      customCreateReportError: createReportError,
    });
    expect(createReportError).toHaveBeenCalled();
    expect(mockReportError).toHaveBeenCalledTimes(1);
    expect(mockReportError).toHaveBeenNthCalledWith(
      1,
      'Invalid config in "checkExactVersions.test.onlyWarnsFor"',
      'no warning was raised for "testa"',
      false,
    );
  });
});
