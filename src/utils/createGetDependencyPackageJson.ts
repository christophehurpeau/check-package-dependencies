import type { PackageJson } from "./packageTypes";
import {
  internalLoadPackageJsonFromNodeModules,
  readPkgJson,
} from "./pkgJsonUtils";

export type GetDependencyPackageJson = (pkgDepName: string) => PackageJson;

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
    if (pkgDepName.startsWith(".")) {
      const packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = internalReadPkgJson(packagePath);
    } else {
      try {
        pkg = internalCustomLoadPackageJsonFromNodeModules(
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
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw error;
        }
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };
}
