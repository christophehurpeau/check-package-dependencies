import { createReportError } from "../utils/createReportError.js";
import { getKeys } from "../utils/object.js";
export function checkIdenticalVersions(pkg, pkgPathName, type, deps, onlyWarnsForCheck, customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError("Identical Versions", pkgPathName);
    getKeys(deps).forEach((depKey) => {
        const version = pkgDependencies[depKey];
        if (!version) {
            reportError({
                title: `Unexpected missing ${type}`,
                info: `missing "${depKey}"`,
            });
            return;
        }
        const depConfigArrayOrObject = deps[depKey];
        const depConfig = Array.isArray(depConfigArrayOrObject)
            ? { [type]: depConfigArrayOrObject }
            : depConfigArrayOrObject;
        getKeys(depConfig).forEach((depKeyType) => {
            const pkgDependenciesType = pkg[depKeyType] || {};
            depConfig[depKeyType]?.forEach((depKeyIdentical) => {
                const value = pkgDependenciesType[depKeyIdentical];
                if (!value) {
                    reportError({
                        title: `Missing "${depKeyIdentical}"`,
                        info: `it should be "${version}"`,
                        dependency: { name: depKey, origin: depKeyType },
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    });
                }
                if (value !== version) {
                    reportError({
                        title: `Invalid "${depKeyIdentical}"`,
                        info: `expecting "${value}" to be "${version}"`,
                        dependency: { name: depKey, origin: depKeyType },
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    });
                }
            });
        });
    });
}
//# sourceMappingURL=checkIdenticalVersions.js.map