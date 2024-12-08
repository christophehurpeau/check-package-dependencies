import { createReportError, fromDependency, inDependency, } from "../utils/createReportError.js";
export function checkIdenticalVersionsThanDependency(pkg, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck, customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError(`Same Versions than ${depPkg.name || ""}`, pkg.path);
    depKeys.forEach((depKey) => {
        const version = dependencies[depKey];
        const depValue = pkgDependencies[depKey];
        if (!version) {
            reportError({
                errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(depPkg)}`,
                errorDetails: `config expects "${depKey}" to be present`,
            });
            return;
        }
        if (version.startsWith("^") || version.startsWith("~")) {
            reportError({
                errorMessage: `Unexpected range dependency "${depKey}" ${inDependency(depPkg)}`,
                errorDetails: "perhaps use checkSatisfiesVersionsFromDependency() instead",
            });
            return;
        }
        const value = depValue?.value;
        if (!value) {
            reportError({
                errorMessage: `Missing "${depKey}"`,
                errorDetails: `expecting to be "${version}"`,
                dependency: { name: depKey, fieldName: type },
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
            return;
        }
        if (value !== version) {
            reportError({
                errorMessage: `Invalid "${value}"`,
                errorDetails: `expecting "${value}" to be "${version}" ${fromDependency(depPkg)}`,
                dependency: depValue,
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
        }
    });
}
//# sourceMappingURL=checkIdenticalVersionsThanDependency.js.map