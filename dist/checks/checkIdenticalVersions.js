import { createReportError } from "../utils/createReportError.js";
import { getKeys } from "../utils/object.js";
export function checkIdenticalVersions(pkg, pkgPathName, type, deps, onlyWarnsForCheck, customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError("Identical Versions", pkgPathName);
    getKeys(deps).forEach((depKey) => {
        const version = pkgDependencies[depKey];
        if (!version) {
            reportError(`Unexpected missing ${type} for "${depKey}".`);
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
                    reportError(`Missing "${depKeyIdentical}" in ${depKeyType}`, `it should be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
                }
                if (value !== version) {
                    reportError(`Invalid "${depKeyIdentical}" in ${depKeyType}`, `expecting "${value}" be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
                }
            });
        });
    });
}
//# sourceMappingURL=checkIdenticalVersions.js.map