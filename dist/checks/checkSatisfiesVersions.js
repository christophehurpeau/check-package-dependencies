import semver from "semver";
import { createReportError } from "../utils/createReportError.js";
export function checkSatisfiesVersions(pkg, type, dependenciesRanges, onlyWarnsForCheck, { customCreateReportError = createReportError, } = {}) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError("Satisfies Versions", pkg.path);
    Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
        const pkgRange = pkgDependencies[depKey];
        if (!pkgRange?.value) {
            reportError({
                errorMessage: "Missing",
                errorDetails: `should satisfies "${range}"`,
                dependency: { name: depKey, fieldName: type },
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
        }
        else {
            const minVersionOfVersion = semver.minVersion(pkgRange.value);
            if (!minVersionOfVersion ||
                !semver.satisfies(minVersionOfVersion, range, {
                    includePrerelease: true,
                })) {
                reportError({
                    errorMessage: "Invalid",
                    errorDetails: `"${pkgRange.value}" should satisfies "${range}"`,
                    dependency: pkgRange,
                    onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                });
            }
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersions.js.map