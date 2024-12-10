import assert from "node:assert/strict";
import { beforeEach, describe, mock, test } from "node:test";
import { createGetDependencyPackageJson } from "./createGetDependencyPackageJson.ts";
import type { PackageJson } from "./packageTypes.ts";

describe("createGetDependencyPackageJson", () => {
  beforeEach(() => {
    mock.reset();
  });

  test("on windows with error", () => {
    const internalLoadPackageJsonFromNodeModulesMock = mock.fn(() => {
      const err: NodeJS.ErrnoException = new Error(
        "Package subpath './package.json' is not defined by \"exports\" in C:\\test\\check-package-dependencies\\node_modules\\test1\\package.json imported from C:\\test\\check-package-dependencies\\package.json",
      );
      err.code = "ERR_PACKAGE_PATH_NOT_EXPORTED";
      throw err;
    });

    const mockPkg: PackageJson = { name: "test1" };
    const readPkgJsonMock = mock.fn(() => mockPkg);

    const getDependencyPackageJson = createGetDependencyPackageJson({
      pkgDirname: "test",
      internalCustomLoadPackageJsonFromNodeModules:
        internalLoadPackageJsonFromNodeModulesMock,
      internalReadPkgJson: readPkgJsonMock,
    });

    const [res] = getDependencyPackageJson("test1");

    assert.equal(res, mockPkg);
    assert.equal(
      internalLoadPackageJsonFromNodeModulesMock.mock.calls.length,
      1,
    );
    assert.deepEqual(
      internalLoadPackageJsonFromNodeModulesMock.mock.calls[0].arguments,
      ["test1", "test"],
    );
    assert.equal(readPkgJsonMock.mock.calls.length, 1);
    assert.deepEqual(readPkgJsonMock.mock.calls[0].arguments, [
      "C:\\test\\check-package-dependencies\\node_modules\\test1\\package.json",
    ]);
  });
});
