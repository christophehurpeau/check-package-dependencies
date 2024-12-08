import semver from "semver";
import { createReportError, fromDependency, inDependency, } from "../utils/createReportError.js";
export function checkSatisfiesVersionsBetweenDependencies(dep1PkgPath, dep1Pkg, dep1Type, depKeys, dep2Pkg, dep2Type, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError = createReportError, }) {
    const dep1Dependencies = dep1Pkg[dep1Type] || {};
    const dep2Dendencies = dep2Pkg[dep2Type] || {};
    const reportError = customCreateReportError("Satisfies Versions From Dependency", dep1PkgPath);
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