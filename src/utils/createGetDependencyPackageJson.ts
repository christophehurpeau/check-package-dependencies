import { readFileSync } from 'fs';
import type { PackageJson } from './packageTypes';

export type GetDependencyPackageJson = (pkgDepName: string) => PackageJson;

export function readPkgJson(packagePath: string): PackageJson {
  return JSON.parse(readFileSync(packagePath, 'utf-8')) as PackageJson;
}

type NodeModulesPackagePathCache = Map<string, PackageJson>;

interface CreateGetDependencyPackageJsonOptions {
  pkgDirname: string;
  nodeModulesPackagePathCache?: NodeModulesPackagePathCache;
}

export function createGetDependencyPackageJson({
  pkgDirname,
  nodeModulesPackagePathCache = new Map<string, PackageJson>(),
}: CreateGetDependencyPackageJsonOptions): GetDependencyPackageJson {
  return (pkgDepName) => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg: PackageJson;
    if (pkgDepName.startsWith('.')) {
      const packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = readPkgJson(packagePath);
    } else {
      try {
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-unsafe-assignment
        pkg = require(require.resolve(`${pkgDepName}/package.json`, {
          paths: [pkgDirname],
        }));
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
          throw err;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const match = / in (.*\/package.json)$/.exec(err.message);

        if (match) {
          const [, matchPackageJson] = match;
          pkg = readPkgJson(matchPackageJson);
        }
        throw err;
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };
}
