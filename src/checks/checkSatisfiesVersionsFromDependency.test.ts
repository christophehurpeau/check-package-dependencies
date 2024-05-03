import type { DependencyTypes, PackageJson } from 'utils/packageTypes';
import { checkSatisfiesVersionsFromDependency } from './checkSatisfiesVersionsFromDependency';

const jest = import.meta.jest;

describe(checkSatisfiesVersionsFromDependency.name, () => {
  const mockReportError = jest.fn();
  const createReportError = jest.fn().mockReturnValue(mockReportError);

  beforeEach(() => {
    mockReportError.mockReset();
  });
  it('should return no error when no keys', () => {
    checkSatisfiesVersionsFromDependency(
      { name: 'test' },
      'path',
      'dependencies',
      [],
      { name: 'depTest', dependencies: {} },
      'dependencies',
      { customCreateReportError: createReportError },
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  describe('expect no error', () => {
    it.each([
      ['test1', 'devDependencies', 'is exact', '1.0.0', '1.0.0'],
      ['test2', 'devDependencies', 'is in range (^)', '1.0.0', '1.0.0'],
      ['test2', 'devDependencies', 'is range (^) in range (^)'],
      ['test3', 'dependencies'],
      ['test3', 'resolutions'],
    ])(
      'should return no error when %s in %s is %s',
      (depName, depTypeInDep, _, depValueInDep, depValueInPkg) => {
        const depTypeInPkg: DependencyTypes = 'devDependencies';
        const pkg: PackageJson = {
          name: 'test',
          ...(depValueInPkg
            ? { [depTypeInPkg]: { [depName]: depValueInPkg } }
            : {}),
        };

        checkSatisfiesVersionsFromDependency(
          pkg,
          'path',
          depTypeInPkg,
          [depName],
          {
            name: 'test-dep',
            [depTypeInDep]: { [depName]: depValueInDep },
          } as PackageJson,
          depTypeInDep as DependencyTypes,
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).not.toHaveBeenCalled();
      },
    );
  });

  describe('expect error when dependency is expected', () => {
    it.each([
      [
        'test1',
        'missing',
        'devDependencies',
        '1.0.0',
        {},
        'Missing "test1" in devDependencies of "test"',
        '"devDependencies" is missing in "test"',
      ],
      [
        'test2',
        'missing',
        'devDependencies',
        '1.0.0',
        { dependencies: {} },
        'Missing "test2" in devDependencies of "test"',
        '"devDependencies" is missing in "test"',
      ],
      [
        'test3',
        'missing',
        'dependencies',
        '^1.0.0',
        { dependencies: { test2: '^1.0.0' } },
        'Missing "test3" in dependencies of "test"',
        '"test3" is missing in dependencies',
      ],
      [
        'test4',
        'invalid',
        'dependencies',
        '^1.0.0',
        { dependencies: { test4: '0.1.0' } },
        'Invalid "test4" in dependencies of "test"',
        '"0.1.0" does not satisfies "^1.0.0"',
      ],
    ])(
      'should error when %s is %s in %s',
      (depName, _, depType, depRange, pkgContent, errorTitle, errorInfo) => {
        checkSatisfiesVersionsInDependency(
          'path',
          { name: 'test', ...pkgContent },
          { [depType]: { [depName]: depRange } },
          { customCreateReportError: createReportError },
        );
        expect(mockReportError).toHaveBeenCalledWith(errorTitle, errorInfo);
      },
    );
  });
});
