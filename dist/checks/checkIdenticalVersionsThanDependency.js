import { createReportError } from "../utils/createReportError.js";
export function checkIdenticalVersionsThanDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck, customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type] || {};
    const reportError = customCreateReportError(`Same Versions than ${depPkg.name}`, pkgPathName);
    depKeys.forEach((depKey) => {
        const version = dependencies[depKey];
        if (!version) {
            reportError(`Unexpected missing dependency "${depKey}" in "${depPkg.name}".`);
            return;
        }
        if (version.startsWith("^") || version.startsWith("~")) {
            reportError(`Unexpected range dependency in "${depPkg.name}" for "${depKey}"`, "perhaps use checkSatisfiesVersionsFromDependency() instead.");
            return;
        }
        const value = pkgDependencies[depKey];
        if (!value) {
            reportError(`Missing "${depKey}" in ${type}`, `expecting to be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
        }
        if (value !== version) {
            reportError(`Invalid "${depKey}" in ${type}`, `expecting "${value}" to be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
        }
    });
}
//# sourceMappingURL=checkIdenticalVersionsThanDependency.js.map