import semver from "semver";
import { createReportError } from "../utils/createReportError.js";
import { getEntries } from "../utils/object.js";
export function checkSatisfiesVersionsInDependency(pkgPathName, depPkg, dependenciesRanges, { customCreateReportError = createReportError, } = {}) {
    const reportError = customCreateReportError(`Satisfies Versions In Dependency "${depPkg.name}"`, pkgPathName);
    for (const [dependenciesType, dependenciesTypeRanges] of getEntries(dependenciesRanges)) {
        if (!dependenciesTypeRanges)
            return;
        const dependencies = depPkg[dependenciesType];
        for (const [dependencyName, dependencyRange] of getEntries(dependenciesTypeRanges)) {
            if (dependencyRange == null) {
                if (dependencies?.[dependencyName]) {
                    reportError(`Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`, "it should not be present");
                }
            }
            else if (!dependencies) {
                reportError(`Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`, `"${dependenciesType}" is missing in "${depPkg.name}"`);
            }
            else if (!dependencies[dependencyName]) {
                reportError(`Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`, `"${dependencyName}" is missing in ${dependenciesType}`);
            }
            else if (!semver.satisfies(dependencies[dependencyName], dependencyRange, {
                includePrerelease: true,
            }) &&
                !semver.intersects(dependencies[dependencyName], dependencyRange, {
                    includePrerelease: true,
                })) {
                reportError(`Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`, `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`);
            }
        }
    }
}
//# sourceMappingURL=checkSatisfiesVersionsInDependency.js.map