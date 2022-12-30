import type { PackageJson } from './packageTypes';
import { internalLoadPackageJsonFromNodeModules, readPkgJson } from './pkgJsonUtils';
export type GetDependencyPackageJson = (pkgDepName: string) => Promise<PackageJson>;
type NodeModulesPackagePathCache = Map<string, PackageJson>;
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