import { createReportError } from "../utils/createReportError.js";
import { getKeys } from "../utils/object.js";
export function checkIdenticalVersions(pkg, type, deps, onlyWarnsForCheck, customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError("Identical Versions", pkg.path);
    getKeys(deps).forEach((depKey) => {
        const version = pkgDependencies[depKey]?.value;
        if (!version) {
            reportError({
                errorMessage: `Unexpected missing ${type}`,
                errorDetails: `missing "${depKey}"`,
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
                const depValue = pkgDependenciesType[depKeyIdentical];
                const value = depValue?.value;
                if (!value) {
                    reportError({
                        errorMessage: `Missing "${depKeyIdentical}" in "${depKeyType}"`,
                        errorDetails: `it should be "${version}" identical to "${depKey}" in "${type}"`,
                        dependency: { name: depKeyIdentical, fieldName: depKeyType },
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    });
                    return;
                }
                if (value !== version) {
                    reportError({
                        errorMessage: `Invalid "${depKeyIdentical}"`,
                        errorDetails: `expecting "${value}" to be "${version}" identical to "${depKey}" in "${type}"`,
                        dependency: depValue,
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    });
                }
            });
        });
    });
}
//# sourceMappingURL=checkIdenticalVersions.js.map