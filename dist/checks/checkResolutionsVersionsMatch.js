import semver from "semver";
export function checkResolutionsVersionsMatch(reportError, pkg, { tryToAutoFix } = {}) {
    const pkgResolutions = pkg.resolutions || {};
    Object.entries(pkgResolutions).forEach(([resolutionKey, resolutionValue]) => {
        let depName = resolutionKey;
        let resolutionDepVersion = resolutionValue?.value;
        if (!resolutionDepVersion)
            return;
        if (resolutionDepVersion.startsWith("patch:")) {
            const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(resolutionKey);
            if (matchResolutionInKey) {
                [, depName, resolutionDepVersion] = matchResolutionInKey;
            }
        }
        ["dependencies", "devDependencies"].forEach((depType) => {
            const range = pkg[depType]?.[depName];
            if (!range)
                return;
            if (!semver.satisfies(resolutionDepVersion, range.value, {
                includePrerelease: true,
            })) {
                if (tryToAutoFix) {
                    range.changeValue(resolutionDepVersion);
                }
                else {
                    reportError({
                        errorMessage: `Invalid "${range.value}"`,
                        errorDetails: `expecting "${range.value}" be "${resolutionDepVersion}" from resolutions`,
                        dependency: range,
                        autoFixable: true,
                    });
                }
            }
        });
    });
}
//# sourceMappingURL=checkResolutionsVersionsMatch.js.map