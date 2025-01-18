import semver from "semver";
import { fromDependency, inDependency, } from "../reporting/cliErrorReporting.js";
export function checkSatisfiesVersionsBetweenDependencies(reportError, dep1Pkg, dep1Type, depKeys, dep2Pkg, dep2Type, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, }) {
    const dep1Dependencies = dep1Pkg[dep1Type] || {};
    const dep2Dendencies = dep2Pkg[dep2Type] || {};
    depKeys.forEach((depKey) => {
        const dep1Range = dep1Dependencies[depKey];
        if (!dep1Range) {
            reportError({
                errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep1Pkg, dep1Type)}`,
                errorDetails: `config expects "${depKey}"`,
                onlyWarns: undefined,
                autoFixable: undefined,
            });
            return;
        }
        const dep2Range = dep2Dendencies[depKey];
        if (!dep2Range) {
            reportError({
                errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
                errorDetails: `should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
            return;
        }
        const minVersionOfVersion = semver.minVersion(dep2Range);
        if (!minVersionOfVersion ||
            !semver.satisfies(minVersionOfVersion, dep1Range, {
                includePrerelease: true,
            })) {
            reportError({
                errorMessage: `Invalid "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
                errorDetails: `"${dep2Range}" should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
                onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            });
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersionsBetweenDependencies.js.map