import semver from "semver";
export function checkSatisfiesVersions(reportError, pkg, type, dependenciesRanges, onlyWarnsForCheck) {
    const pkgDependencies = pkg[type] || {};
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