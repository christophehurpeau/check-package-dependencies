import { regularDependencyTypes } from "../../checks/checkDirectPeerDependencies.js";
import { checkDuplicateDependencies } from "../../checks/checkDuplicateDependencies.js";
import { checkSatisfiesPeerDependency } from "../../checks/checkPeerDependencies.js";
import { getKeys } from "../../utils/object.js";
import { createPackageRule } from "../create-rule/createPackageRule.js";
const duplicatesSearchInByDependencyType = {
    devDependencies: ["devDependencies", "dependencies"],
    dependencies: ["devDependencies", "dependencies"],
    peerDependencies: ["peerDependencies"],
};
const checkDuplicateInAllDependencies = (reportError, basePkg, subPkg, isPkgLibrary, onlyWarnsForCheck) => {
    ["devDependencies", "dependencies"].forEach((depType) => {
        const dependencies = basePkg[depType];
        if (!dependencies || !duplicatesSearchInByDependencyType[depType])
            return;
        checkDuplicateDependencies(({ dependency, errorMessage, ...otherDetails }) => {
            // hide dependency from error details as it is the dependency of the sub package and we are in the context of the root package
            reportError({
                ...otherDetails,
                errorMessage: `${subPkg.name}: ${errorMessage}`,
            });
        }, subPkg, isPkgLibrary, depType, duplicatesSearchInByDependencyType[depType], basePkg.value, onlyWarnsForCheck);
    });
};
// TODO this rule is currently very limited in the way errors are reported. It should be improved.
export const workspaceDependenciesRule = createPackageRule("workspace-dependencies", {
    type: "object",
    properties: {},
    additionalProperties: false,
}, {
    checkPackage: ({ pkg, settings, reportError, loadWorkspacePackageJsons, getDependencyPackageJson, onlyWarnsForMappingCheck, }) => {
        if (!pkg.value.workspaces) {
            return;
        }
        const workspacePackageJsons = loadWorkspacePackageJsons();
        const previousCheckedWorkspaces = [];
        for (const subPkg of workspacePackageJsons) {
            const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor(subPkg.name);
            // root
            checkDuplicateInAllDependencies(reportError, pkg, subPkg, settings.isLibrary ?? false, onlyWarnsForCheck);
            // previous packages
            previousCheckedWorkspaces.forEach((previousSubPkg) => {
                checkDuplicateInAllDependencies(reportError, previousSubPkg, subPkg, settings.isLibrary ?? false, onlyWarnsForCheck);
            });
            // add to previous checked workspaces
            previousCheckedWorkspaces.push(subPkg);
            // peer dependencies via monorepo that is not present in the sub package
            const allDepPkgs = [];
            regularDependencyTypes.forEach((depType) => {
                const dependencies = subPkg[depType];
                if (!dependencies)
                    return;
                for (const depName of getKeys(dependencies)) {
                    const [depPkg] = getDependencyPackageJson(depName);
                    if (pkg.devDependencies?.[depName]) {
                        continue; // we already checked this.
                    }
                    allDepPkgs.push({ name: depName, type: depType, pkg: depPkg });
                }
            });
            for (const { name: depName, type: depType, pkg: depPkg, } of allDepPkgs) {
                if (depPkg.peerDependencies) {
                    for (const [peerDepName, range] of Object.entries(depPkg.peerDependencies)) {
                        if (subPkg.devDependencies?.[peerDepName]) {
                            continue; // skip as already checked in checkDirectPeerDependencies for the subpackage itself.
                        }
                        checkSatisfiesPeerDependency(reportError, pkg, depType, ["devDependencies"], peerDepName, range, depPkg, onlyWarnsForMappingCheck.createFor(`${depName}:peedDepdencies:invalid`));
                    }
                }
            }
        }
    },
});
//# sourceMappingURL=workspace-dependencies.js.map