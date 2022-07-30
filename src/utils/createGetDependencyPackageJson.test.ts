import type { PackageJson } from 'type-fest';
import { createGetDependencyPackageJson } from './createGetDependencyPackageJson';

jest.mock('./createGetDependencyPackageJson', () => ({
  ...jest.requireActual('./createGetDependencyPackageJson'),
  readPkgJson: jest.fn(),
  writePkgJson: jest.fn(),
  internalLoadPackageJsonFromNodeModules: jest.fn(),
}));

describe('createGetDependencyPackageJson', () => {
  test('on windows with error', () => {
    const internalLoadPackageJsonFromNodeModulesMock = jest
      .fn()
      .mockImplementation(() => {
        const err: NodeJS.ErrnoException = new Error(
          'Package subpath \'./package.json\' is not defined by "exports" in C:\\test\\check-package-dependencies\\node_modules\\test1\\package.json',
        );
        err.code = 'ERR_PACKAGE_PATH_NOT_EXPORTED';

        throw err;
      });

    const mockPkg: PackageJson = {};
    const readPkgJsonMock = jest.fn((pkgPath: string) => mockPkg);

    const getDependencyPackageJson = createGetDependencyPackageJson({
      pkgDirname: 'test',
      internalCustomLoadPackageJsonFromNodeModules:
        internalLoadPackageJsonFromNodeModulesMock,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      internalReadPkgJson: readPkgJsonMock as any,
    });

    const res = getDependencyPackageJson('test1');

    expect(res).toBe(mockPkg);
    expect(internalLoadPackageJsonFromNodeModulesMock).toBeCalledWith(
      'test1',
      'test',
    );
    expect(readPkgJsonMock).toBeCalledWith(
      'C:\\test\\check-package-dependencies\\node_modules\\test1\\package.json',
    );
  });
});
