import semver from "semver";
export function checkSatisfiesVersion(reportError, dependencyValue, range, onlyWarnsForCheck) {
    const minVersionOfVersion = semver.minVersion(dependencyValue.value);
    if (!minVersionOfVersion ||
        !semver.satisfies(minVersionOfVersion, range, {
            includePrerelease: true,
        })) {
        const maxSatisfying = semver.maxSatisfying([dependencyValue.value, range], range, { includePrerelease: true });
        reportError({
            errorMessage: "Invalid",
            errorDetails: `"${dependencyValue.value}" should satisfies "${range}"`,
            dependency: dependencyValue,
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(dependencyValue.name),
            ...(maxSatisfying && {
                suggestions: [
                    [dependencyValue, maxSatisfying, `Use version ${maxSatisfying}`],
                ],
            }),
        });
    }
}
export function checkMissingSatisfiesVersions(reportError, pkg, type, dependenciesRanges, onlyWarnsForCheck) {
    const pkgDependencies = pkg.value[type];
    Object.entries(dependenciesRanges).forEach(([name, range]) => {
        const pkgDependency = pkgDependencies?.[name];
        if (!pkgDependency) {
            reportError({
                errorMessage: `Missing "${name}" in "${type}"`,
                errorDetails: `should satisfies "${range}"`,
                dependency: { name, fieldName: type },
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(name),
            });
        }
    });
}
export function checkSatisfiesVersions(reportError, pkg, type, dependenciesRanges, onlyWarnsForCheck) {
    checkMissingSatisfiesVersions(reportError, pkg, type, dependenciesRanges, onlyWarnsForCheck);
    const pkgDependencies = pkg[type] || {};
    Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
        const pkgRange = pkgDependencies[depKey];
        if (pkgRange) {
            checkSatisfiesVersion(reportError, pkgRange, range, onlyWarnsForCheck);
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersions.js.map