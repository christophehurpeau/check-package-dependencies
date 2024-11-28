import semver from "semver";
import { getRealVersion } from "../utils/semverUtils.js";
export function checkPeerDependencies(pkg, reportError, type, allowedPeerIn, allowMissing, providedDependencies, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
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
            reportError(`Missing "${peerDepName}" peer dependency from "${depPkg.name}" in ${type}`, `it should satisfies "${range}" and be in ${allowedPeerIn.join(" or ")}${additionalDetails}`, missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName));
        }
        else {
            const versions = versionsIn.map((versionsInType) => pkg[versionsInType][peerDepName]);
            versions.forEach((versionValue, index) => {
                const version = getRealVersion(versionValue);
                if (version === "*") {
                    return;
                }
                const minVersionOfVersion = semver.minVersion(version);
                if (!minVersionOfVersion ||
                    !semver.satisfies(minVersionOfVersion, range, {
                        includePrerelease: true,
                    })) {
                    reportError(`Invalid "${peerDepName}" peer dependency`, `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`, invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName));
                }
            });
        }
    }
}
//# sourceMappingURL=checkPeerDependencies.js.map