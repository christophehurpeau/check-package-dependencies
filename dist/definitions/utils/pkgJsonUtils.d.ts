import type { PackageJson } from "./packageTypes.ts";
export declare function readPkgJson(packagePath: string): PackageJson;
export declare function writePkgJson(packagePath: string, pkg: PackageJson): void;
/** @internal */
export declare function internalLoadPackageJsonFromNodeModules(pkgDepName: string, pkgDirname: string): PackageJson;
//# sourceMappingURL=pkgJsonUtils.d.ts.map