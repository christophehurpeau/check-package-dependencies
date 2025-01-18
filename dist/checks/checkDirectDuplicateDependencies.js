import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.js";
import { getKeys } from "../utils/object.js";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.js";
export function checkDirectDuplicateDependencies(reportError, pkg, isPackageALibrary, depType, getDependencyPackageJson, onlyWarnsForCheck) {
    const checks = [
        {
            type: "devDependencies",
            searchIn: ["devDependencies", "dependencies"],
        },
        { type: "dependencies", searchIn: ["devDependencies", "dependencies"] },
    ];
    checks.forEach(({ type, searchIn }) => {
        const dependencies = pkg[type];
        if (!dependencies)
            return;
        for (const depName of getKeys(dependencies)) {
            const [depPkg] = getDependencyPackageJson(depName);
            checkDuplicateDependencies(reportError, pkg, isPackageALibrary, depType, searchIn, depPkg, onlyWarnsForCheck.createFor(depName));
        }
    });
    reportNotWarnedForMapping(reportError, onlyWarnsForCheck);
}
//# sourceMappingURL=checkDirectDuplicateDependencies.js.map