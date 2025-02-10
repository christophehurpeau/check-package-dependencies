import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.js";
import { getKeys } from "../utils/object.js";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.js";
import { checkSatisfiesPeerDependency } from "./checkPeerDependencies.js";
export function checkMonorepoDirectSubpackagePeerDependencies(reportError, isLibrary, monorepoPkg, subpackagePkg, getDependencyPackageJson, invalidOnlyWarnsForCheck, missingOnlyWarnsForCheck) {
    const allDepPkgs = [];
    regularDependencyTypes.forEach((depType) => {
        const dependencies = subpackagePkg[depType];
        if (!dependencies)
            return;
        for (const depName of getKeys(dependencies)) {
            const [depPkg] = getDependencyPackageJson(depName);
            if (monorepoPkg.devDependencies?.[depName]) {
                continue; // we already checked this.
            }
            allDepPkgs.push({ name: depName, type: depType, pkg: depPkg });
        }
    });
    for (const { name: depName, type: depType, pkg: depPkg } of allDepPkgs) {
        if (depPkg.peerDependencies) {
            for (const [peerDepName, range] of Object.entries(depPkg.peerDependencies)) {
                if (subpackagePkg.devDependencies?.[peerDepName]) {
                    continue; // skip as already checked in checkDirectPeerDependencies for the subpackage itself.
                }
                checkSatisfiesPeerDependency(reportError, monorepoPkg, depType, ["devDependencies"], peerDepName, range, depPkg, invalidOnlyWarnsForCheck.createFor(depName));
            }
        }
    }
    reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
    if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
        reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
    }
}
//# sourceMappingURL=checkMonorepoDirectSubpackagePeerDependencies.js.map