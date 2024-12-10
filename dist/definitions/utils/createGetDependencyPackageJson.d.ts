import type { PackageJson } from "./packageTypes.ts";
import { internalLoadPackageJsonFromNodeModules, readPkgJson } from "./pkgJsonUtils.ts";
type DependencyPackageJsonResult = [pkg: PackageJson, pkgPath: string];
export type GetDependencyPackageJson = (pkgDepName: string) => DependencyPackageJsonResult;
type NodeModulesPackagePathCache = Map<string, DependencyPackageJsonResult>;
interface CreateGetDependencyPackageJsonOptions {
    pkgDirname: string;
    nodeModulesPackagePathCache?: NodeModulesPackagePathCache;
    /** @internal */
    internalCustomLoadPackageJsonFromNodeModules?: typeof internalLoadPackageJsonFromNodeModules;
    /** @internal */
    internalReadPkgJson?: typeof readPkgJson;
}
export declare function createGetDependencyPackageJson({ pkgDirname, nodeModulesPackagePathCache, internalCustomLoadPackageJsonFromNodeModules, internalReadPkgJson, }: CreateGetDependencyPackageJsonOptions): GetDependencyPackageJson;
export {};
//# sourceMappingURL=createGetDependencyPackageJson.d.ts.map