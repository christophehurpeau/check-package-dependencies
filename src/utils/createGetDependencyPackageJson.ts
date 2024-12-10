import type { PackageJson } from "./packageTypes.ts";
import {
  internalLoadPackageJsonFromNodeModules,
  readPkgJson,
} from "./pkgJsonUtils.ts";

type DependencyPackageJsonResult = [pkg: PackageJson, pkgPath: string];

export type GetDependencyPackageJson = (
  pkgDepName: string,
) => DependencyPackageJsonResult;

type NodeModulesPackagePathCache = Map<string, DependencyPackageJsonResult>;

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
  nodeModulesPackagePathCache = new Map<string, DependencyPackageJsonResult>(),
  internalCustomLoadPackageJsonFromNodeModules = internalLoadPackageJsonFromNodeModules,
  internalReadPkgJson = readPkgJson,
}: CreateGetDependencyPackageJsonOptions): GetDependencyPackageJson {
  return (pkgDepName) => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg: PackageJson;
    let packagePath: string;
    if (pkgDepName.startsWith(".")) {
      packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = internalReadPkgJson(packagePath);
    } else {
      try {
        [packagePath, pkg] = internalCustomLoadPackageJsonFromNodeModules(
          pkgDepName,
          pkgDirname,
        );
      } catch (error: unknown) {
        if (!(error instanceof Error)) throw error;

        if (
          (error as NodeJS.ErrnoException).code !==
          "ERR_PACKAGE_PATH_NOT_EXPORTED"
        ) {
          throw error;
        }

        const match = / in (.*[/\\]package\.json)\s+imported from/.exec(
          error.message,
        );

        if (match) {
          const [, matchPackageJson] = match;
          packagePath = matchPackageJson;
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw error;
        }
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, [pkg, packagePath]);
    return [pkg, packagePath];
  };
}
