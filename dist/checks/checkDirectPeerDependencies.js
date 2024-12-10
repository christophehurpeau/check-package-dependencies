import semver from "semver";
import { createReportError, reportNotWarnedForMapping, } from "../utils/createReportError.js";
import { getKeys } from "../utils/object.js";
import { checkPeerDependencies } from "./checkPeerDependencies.js";
const regularDependencyTypes = [
    "devDependencies",
    "dependencies",
    "optionalDependencies",
];
const getAllowedPeerInFromType = (depPkgType, isLibrary) => {
    switch (depPkgType) {
        case "devDependencies":
            return ["devDependencies", "dependencies"];
        case "dependencies":
            return isLibrary
                ? ["dependencies", "peerDependencies"]
                : ["devDependencies", "dependencies"];
        case "optionalDependencies":
            return isLibrary
                ? ["dependencies", "optionalDependencies", "peerDependencies"]
                : ["devDependencies", "dependencies"];
        // no default
    }
};
export function checkDirectPeerDependencies(isLibrary, pkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck, customCreateReportError = createReportError) {
    const reportError = customCreateReportError("Peer Dependencies", pkg.path);
    const allDepPkgs = [];
    const allDirectDependenciesDependencies = [];
    regularDependencyTypes.forEach((depType) => {
        const dependencies = pkg[depType];
        if (!dependencies)
            return;
        for (const depName of getKeys(dependencies)) {
            const [depPkg] = getDependencyPackageJson(depName);
            allDepPkgs.push({
                name: depName,
                type: depType,
                pkg: depPkg,
                hasDirectMatchingPeerDependency: pkg.peerDependencies?.[depName]
                    ? semver.intersects(dependencies[depName].value, pkg.peerDependencies[depName].value)
                    : false,
            });
            if (depPkg.dependencies && !isLibrary) {
                allDirectDependenciesDependencies.push(...Object.entries(depPkg.dependencies));
            }
        }
    });
    for (const { name: depName, type: depType, pkg: depPkg, hasDirectMatchingPeerDependency, } of allDepPkgs) {
        if (depPkg.peerDependencies) {
            checkPeerDependencies(pkg, reportError, depType, getAllowedPeerInFromType(depType, isLibrary), hasDirectMatchingPeerDependency, allDirectDependenciesDependencies, depPkg, missingOnlyWarnsForCheck.createFor(depName), invalidOnlyWarnsForCheck.createFor(depName));
        }
    }
    reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
    if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
        reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
    }
}
//# sourceMappingURL=checkDirectPeerDependencies.js.map