import type { PackageJson, ParsedPackageJson } from "./packageTypes.ts";
export declare function readPkgJson(packagePath: string): PackageJson;
export declare function writePkgJson(packagePath: string, pkg: PackageJson): void;
export declare function parsePkg(packageContent: string, packagePath: string): ParsedPackageJson;
export declare function parsePkgValue(pkg: unknown, packagePath?: string): ParsedPackageJson;
export declare function readAndParsePkgJson(packagePath: string): ParsedPackageJson;
/** @internal */
export declare function internalLoadPackageJsonFromNodeModules(pkgDepName: string, pkgDirname: string): PackageJson;
//# sourceMappingURL=pkgJsonUtils.d.ts.map