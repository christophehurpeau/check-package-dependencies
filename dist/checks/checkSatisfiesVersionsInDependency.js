import semver from "semver";
import { createReportError, inDependency } from "../utils/createReportError.js";
import { getEntries } from "../utils/object.js";
export function checkSatisfiesVersionsInDependency(pkgPathName, depPkg, dependenciesRanges, { customCreateReportError = createReportError, } = {}) {
    const reportError = customCreateReportError("Satisfies Versions In Dependency", pkgPathName);
    for (const [dependenciesType, dependenciesTypeRanges] of getEntries(dependenciesRanges)) {
        if (!dependenciesTypeRanges)
            return;
        const dependencies = depPkg[dependenciesType];
        for (const [dependencyName, dependencyRange] of getEntries(dependenciesTypeRanges)) {
            if (dependencyRange == null) {
                if (dependencies?.[dependencyName]) {
                    reportError({
                        errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
                        errorDetails: "it should not be present",
                        dependency: { name: dependencyName },
                    });
                }
            }
            else if (!dependencies) {
                reportError({
                    errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
                    errorDetails: `"${dependenciesType}" is missing`,
                    dependency: { name: dependencyName },
                });
            }
            else if (!dependencies[dependencyName]) {
                reportError({
                    errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
                    errorDetails: `"${dependencyName}" is missing but should satisfies "${dependencyRange}"`,
                    dependency: { name: dependencyName },
                });
            }
            else if (!semver.satisfies(dependencies[dependencyName], dependencyRange, {
                includePrerelease: true,
            }) &&
                !semver.intersects(dependencies[dependencyName], dependencyRange, {
                    includePrerelease: true,
                })) {
                reportError({
                    errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
                    errorDetails: `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`,
                    dependency: { name: dependencyName },
                });
            }
        }
    }
}
//# sourceMappingURL=checkSatisfiesVersionsInDependency.js.map