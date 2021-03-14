import type { PackageJson } from './packageTypes';
export declare type GetDependencyPackageJson = (pkgDepName: string) => PackageJson;
export declare function readPkgJson(packagePath: string): PackageJson;
declare type NodeModulesPackagePathCache = Map<string, PackageJson>;
interface CreateGetDependencyPackageJsonOptions {
    pkgDirname: string;
    nodeModulesPackagePathCache?: NodeModulesPackagePathCache;
}
export declare function createGetDependencyPackageJson({ pkgDirname, nodeModulesPackagePathCache, }: CreateGetDependencyPackageJsonOptions): GetDependencyPackageJson;
export {};
//# sourceMappingURL=createGetDependencyPackageJson.d.ts.map