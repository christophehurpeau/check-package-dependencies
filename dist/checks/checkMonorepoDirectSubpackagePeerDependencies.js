import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.js";
import { getKeys } from "../utils/object.js";
import { regularDependencyTypes } from "./checkDirectPeerDependencies.js";
import { checkPeerDependencies } from "./checkPeerDependencies.js";
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
            checkPeerDependencies(reportError, monorepoPkg, depType, ["devDependencies"], true, // we only check those that are defined in monorepo pkg, to make sure if there were missing in subpackage, that we don't have several versions of them.
            [], // this is only used if allowMissing is not true
            depPkg, missingOnlyWarnsForCheck.createFor(depName), invalidOnlyWarnsForCheck.createFor(depName));
        }
    }
    reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
    if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
        reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
    }
}
//# sourceMappingURL=checkMonorepoDirectSubpackagePeerDependencies.js.map