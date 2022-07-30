import { readFileSync, writeFileSync } from 'fs';
import type { PackageJson } from './packageTypes';

export type GetDependencyPackageJson = (pkgDepName: string) => PackageJson;

export function readPkgJson(packagePath: string): PackageJson {
  return JSON.parse(readFileSync(packagePath, 'utf8')) as PackageJson;
}

export function writePkgJson(packagePath: string, pkg: PackageJson): void {
  writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}

/** @internal */
export function internalLoadPackageJsonFromNodeModules(
  pkgDepName: string,
  pkgDirname: string,
): PackageJson {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
  return require(require.resolve(`${pkgDepName}/package.json`, {
    paths: [pkgDirname],
  })) as PackageJson;
}

type NodeModulesPackagePathCache = Map<string, PackageJson>;

interface CreateGetDependencyPackageJsonOptions {
  pkgDirname: string;
  nodeModulesPackagePathCache?: NodeModulesPackagePathCache;
  /** @internal */
  internalCustomLoadPackageJsonFromNodeModules?: typeof internalLoadPackageJsonFromNodeModules;
  /** @internal */
  internalReadPkgJson?: typeof readPkgJson;
}

export function createGetDependencyPackageJson({
  pkgDirname,
  nodeModulesPackagePathCache = new Map<string, PackageJson>(),
  internalCustomLoadPackageJsonFromNodeModules = internalLoadPackageJsonFromNodeModules,
  internalReadPkgJson = readPkgJson,
}: CreateGetDependencyPackageJsonOptions): GetDependencyPackageJson {
  return (pkgDepName) => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg: PackageJson;
    if (pkgDepName.startsWith('.')) {
      const packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = internalReadPkgJson(packagePath);
    } else {
      try {
        pkg = internalCustomLoadPackageJsonFromNodeModules(
          pkgDepName,
          pkgDirname,
        );
      } catch (err: unknown) {
        if (!(err instanceof Error)) throw err;

        if (
          (err as NodeJS.ErrnoException).code !==
          'ERR_PACKAGE_PATH_NOT_EXPORTED'
        ) {
          throw err;
        }

        const match = / in (.*[/\\]package.json)($|\simported from)/.exec(
          err.message,
        );

        if (match) {
          const [, matchPackageJson] = match;
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw err;
        }
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };
}
