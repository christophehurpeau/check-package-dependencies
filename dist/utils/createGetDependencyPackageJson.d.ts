import type { PackageJson } from './packageTypes';
export type GetDependencyPackageJson = (pkgDepName: string) => PackageJson;
export declare function readPkgJson(packagePath: string): PackageJson;
export declare function writePkgJson(packagePath: string, pkg: PackageJson): void;
/** @internal */
export declare function internalLoadPackageJsonFromNodeModules(pkgDepName: string, pkgDirname: string): PackageJson;
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