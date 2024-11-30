import semver from "semver";
import { createReportError } from "../utils/createReportError.js";
export function checkSatisfiesVersions(pkg, pkgPathName, type, dependenciesRanges, onlyWarnsForCheck, { customCreateReportError = createReportError, } = {}) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError("Satisfies Versions", pkgPathName);
    Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
        const version = pkgDependencies[depKey];
        if (!version) {
            reportError({
                title: "Missing",
                info: `should satisfies "${range}"`,
                dependency: { name: depKey, origin: type },
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
        }
        else {
            const minVersionOfVersion = semver.minVersion(version);
            if (!minVersionOfVersion ||
                !semver.satisfies(minVersionOfVersion, range, {
                    includePrerelease: true,
                })) {
                reportError({
                    title: "Invalid",
                    info: `"${version}" should satisfies "${range}"`,
                    dependency: { name: depKey, origin: type },
                    onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                });
            }
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersions.js.map