import { createReportError, reportNotWarnedForMapping, } from "../utils/createReportError.js";
import { getKeys } from "../utils/object.js";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.js";
export function checkDirectDuplicateDependencies(pkg, isPackageALibrary, depType, getDependencyPackageJson, onlyWarnsForCheck, reportErrorNamePrefix = "", customCreateReportError = createReportError) {
    const reportError = customCreateReportError(`${reportErrorNamePrefix}Direct Duplicate Dependencies`, pkg.path);
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