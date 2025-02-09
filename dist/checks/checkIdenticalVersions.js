import { getKeys } from "../utils/object.js";
export function checkIdenticalVersions(reportError, pkg, type, deps, onlyWarnsForCheck) {
    const pkgDependencies = pkg[type] || {};
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
        if (!depConfig) {
            throw new Error(`depConfig is undefined for ${depKey}`);
        }
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