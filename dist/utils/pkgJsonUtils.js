import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve as importResolve } from "import-meta-resolve";
export function readPkgJson(packagePath) {
    return JSON.parse(readFileSync(packagePath, "utf8"));
}
export function writePkgJson(packagePath, pkg) {
    writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}
/** @internal */
export function internalLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname) {
    const packageUrl = importResolve(`${pkgDepName}/package.json`, `file://${pkgDirname}/package.json`);
    return readPkgJson(fileURLToPath(packageUrl));
}
//# sourceMappingURL=pkgJsonUtils.js.map