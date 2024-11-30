import semver from "semver";
import { createReportError } from "../utils/createReportError.js";
export function checkResolutionsVersionsMatch(pkg, pkgPathName, { tryToAutoFix, customCreateReportError = createReportError, } = {}) {
    const pkgResolutions = pkg.resolutions || {};
    const reportError = customCreateReportError("Resolutions match other dependencies", pkgPathName);
    Object.entries(pkgResolutions).forEach(([resolutionKey, resolutionValue]) => {
        let depName = resolutionKey;
        let resolutionDepVersion = resolutionValue;
        if (resolutionValue.startsWith("patch:")) {
            const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(resolutionKey);
            if (matchResolutionInKey) {
                [, depName, resolutionDepVersion] = matchResolutionInKey;
            }
        }
        ["dependencies", "devDependencies"].forEach((depType) => {
            const range = pkg[depType]?.[depName];
            if (!range)
                return;
            if (!semver.satisfies(resolutionDepVersion, range, {
                includePrerelease: true,
            })) {
                if (tryToAutoFix) {
                    pkg[depType][depName] = resolutionDepVersion;
                }
                else {
                    reportError({
                        title: `Invalid "${range}"`,
                        info: `expecting "${range}" be "${resolutionDepVersion}" from resolutions`,
                        dependency: { name: depName, origin: depType },
                        autoFixable: true,
                    });
                }
            }
        });
    });
}
//# sourceMappingURL=checkResolutionsVersionsMatch.js.map