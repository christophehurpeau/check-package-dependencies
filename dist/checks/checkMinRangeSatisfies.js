import semver from "semver";
import semverUtils from "semver-utils";
import { createReportError } from "../utils/createReportError.js";
import { getEntries } from "../utils/object.js";
export function checkMinRangeSatisfies(pkgPathName, pkg, type1 = "dependencies", type2 = "devDependencies", { tryToAutoFix = false, customCreateReportError = createReportError, } = {}) {
    const dependencies1 = pkg[type1];
    const dependencies2 = pkg[type2];
    if (!dependencies1 || !dependencies2) {
        return;
    }
    const reportError = customCreateReportError(`"${type1}" minimum range satisfies "${type2}"`, pkgPathName);
    for (const [depName, depRange1] of getEntries(dependencies1)) {
        if (depRange1 === "*")
            continue;
        const depRange2 = dependencies2[depName];
        if (!depRange2 || !depRange1)
            continue;
        const minDepRange1 = semver.minVersion(depRange1)?.version || depRange1;
        if (!semver.satisfies(minDepRange1, depRange2, {
            includePrerelease: true,
        })) {
            if (tryToAutoFix) {
                const depRange1Parsed = semverUtils.parseRange(depRange1);
                dependencies1[depName] =
                    (depRange1Parsed[0]?.operator || "") +
                        (semver.minVersion(depRange2)?.version || depRange2);
            }
            else {
                reportError({
                    title: `Invalid "${depRange1}"`,
                    info: `"${depRange1}" should satisfies "${depRange2}" from "${type2}"`,
                    dependency: { name: depName, origin: type1 },
                    autoFixable: true,
                });
            }
        }
    }
}
//# sourceMappingURL=checkMinRangeSatisfies.js.map