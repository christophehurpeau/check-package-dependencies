import semver from "semver";
import { fromDependency } from "../reporting/cliErrorReporting.js";
import { getRealVersion } from "../utils/semverUtils.js";
export function checkSatisfiesPeerDependency(reportError, pkg, type, allowedPeerIn, peerDepName, range, depPkg, invalidOnlyWarnsForCheck) {
    const versions = allowedPeerIn.map((versionsInType) => pkg[versionsInType]?.[peerDepName]);
    versions.forEach((versionV, index) => {
        if (!versionV) {
            return;
        }
        const version = getRealVersion(versionV.value);
        if (version === "*" || version.startsWith("patch:")) {
            return;
        }
        const minVersionOfVersion = semver.minVersion(version);
        if (!minVersionOfVersion ||
            !semver.satisfies(minVersionOfVersion, range, {
                includePrerelease: true,
            })) {
            reportError({
                errorMessage: "Invalid peer dependency version",
                errorDetails: `"${version}" should satisfies "${range}" ${fromDependency(depPkg, type)}`,
                dependency: allowedPeerIn[index]
                    ? (pkg[allowedPeerIn[index]]?.[peerDepName] ?? undefined)
                    : undefined,
                onlyWarns: invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
            });
        }
    });
}
export function checkPeerDependencies(reportError, pkg, type, allowedPeerIn, allowMissing, providedDependencies, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
    const { peerDependencies, peerDependenciesMeta } = depPkg;
    if (!peerDependencies)
        return;
    const allowedPeerInExisting = allowedPeerIn.filter((allowedPeerInType) => pkg[allowedPeerInType]);
    for (const [peerDepName, range] of Object.entries(peerDependencies)) {
        const versionsIn = allowedPeerInExisting.filter((allowedPeerInExistingType) => pkg[allowedPeerInExistingType]?.[peerDepName]);
        if (versionsIn.length === 0) {
            if (allowMissing) {
                continue;
            }
            const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepName];
            if (peerDependenciesMetaPeerDep?.optional) {
                continue;
            }
            let additionalDetails = "";
            // satisfied by another direct dependency
            const providedDependenciesForDepName = providedDependencies.filter(([depName]) => depName === peerDepName);
            if (providedDependenciesForDepName.length > 0) {
                if (providedDependenciesForDepName.every(([, depRange]) => semver.intersects(range, depRange))) {
                    continue;
                }
                additionalDetails +=
                    " (required as some dependencies have non-satisfying range too)";
            }
            reportError({
                errorMessage: `Missing "${peerDepName}" peer dependency ${fromDependency(depPkg, type)}`,
                errorDetails: `it should satisfies "${range}" and be in ${allowedPeerIn.join(" or ")}${additionalDetails}`,
                dependency: { name: peerDepName },
                onlyWarns: missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
            });
        }
        else {
            checkSatisfiesPeerDependency(reportError, pkg, type, allowedPeerInExisting, peerDepName, range, depPkg, invalidOnlyWarnsForCheck);
        }
    }
}
//# sourceMappingURL=checkPeerDependencies.js.map