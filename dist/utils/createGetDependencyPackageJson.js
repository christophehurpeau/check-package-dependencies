import { internalLoadPackageJsonFromNodeModules, readPkgJson, } from "./pkgJsonUtils.js";
export function createGetDependencyPackageJson({ pkgDirname, nodeModulesPackagePathCache = new Map(), internalCustomLoadPackageJsonFromNodeModules = internalLoadPackageJsonFromNodeModules, internalReadPkgJson = readPkgJson, }) {
    return (pkgDepName) => {
        const existing = nodeModulesPackagePathCache.get(pkgDepName);
        if (existing)
            return existing;
        let pkg;
        let packagePath;
        if (pkgDepName.startsWith(".")) {
            packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
            pkg = internalReadPkgJson(packagePath);
        }
        else {
            try {
                [packagePath, pkg] = internalCustomLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname);
            }
            catch (error) {
                if (!(error instanceof Error))
                    throw error;
                if (error.code !==
                    "ERR_PACKAGE_PATH_NOT_EXPORTED") {
                    throw error;
                }
                const match = / in (.*[/\\]package\.json)\s+imported from/.exec(error.message);
                if (match) {
                    const [, matchPackageJson] = match;
                    if (!matchPackageJson)
                        throw error;
                    packagePath = matchPackageJson;
                    pkg = internalReadPkgJson(matchPackageJson);
                }
                else {
                    throw error;
                }
            }
        }
        nodeModulesPackagePathCache.set(pkgDepName, [pkg, packagePath]);
        return [pkg, packagePath];
    };
}
//# sourceMappingURL=createGetDependencyPackageJson.js.map