import semver from "semver";
import { reportNotWarnedFor } from "../reporting/cliErrorReporting.js";
import { getRealVersion } from "../utils/semverUtils.js";
const isVersionRange = (version) => version.startsWith("^") ||
    version.startsWith("~") ||
    version.startsWith(">") ||
    version.startsWith("<");
export function checkExactVersion(reportError, dependencyValue, { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix = false, }) {
    const dependencyName = dependencyValue.name;
    const version = getRealVersion(dependencyValue.value);
    if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
            return;
        }
        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
        if (!shouldOnlyWarn && getDependencyPackageJson) {
            let resolvedDep;
            try {
                [resolvedDep] = getDependencyPackageJson(dependencyName);
            }
            catch {
                resolvedDep = null;
            }
            if (!resolvedDep?.version) {
                reportError({
                    errorMessage: "Unexpected range value",
                    errorDetails: `expecting "${version}" to be exact${tryToAutoFix
                        ? `, autofix failed to resolve "${dependencyName}"`
                        : ""}`,
                    errorTarget: "dependencyValue",
                    dependency: dependencyValue,
                    onlyWarns: shouldOnlyWarn,
                });
            }
            else if (!semver.satisfies(resolvedDep.version, version, {
                includePrerelease: true,
            })) {
                reportError({
                    errorMessage: "Unexpected range value",
                    errorDetails: `expecting "${version}" to be exact${tryToAutoFix
                        ? `, autofix failed as resolved version "${resolvedDep.version}" doesn't satisfy "${version}"`
                        : ""}`,
                    dependency: dependencyValue,
                    errorTarget: "dependencyValue",
                    onlyWarns: shouldOnlyWarn,
                });
            }
            else if (tryToAutoFix) {
                dependencyValue.changeValue(resolvedDep.version);
            }
            else {
                reportError({
                    errorMessage: "Unexpected range value",
                    errorDetails: `expecting "${version}" to be exact "${resolvedDep.version}"`,
                    dependency: dependencyValue,
                    errorTarget: "dependencyValue",
                    onlyWarns: shouldOnlyWarn,
                    fixTo: resolvedDep.version,
                });
            }
        }
        else {
            let exactVersion = version.slice(version[1] === "=" ? 2 : 1);
            if (exactVersion.split(".").length < 3) {
                if (exactVersion.split(".").length === 1) {
                    exactVersion = `${exactVersion}.0.0`;
                }
                else {
                    exactVersion = `${exactVersion}.0`;
                }
            }
            reportError({
                errorMessage: "Unexpected range value",
                errorDetails: `expecting "${version}" to be exact "${exactVersion}"`,
                errorTarget: "dependencyValue",
                dependency: dependencyValue,
                onlyWarns: shouldOnlyWarn,
            });
        }
    }
}
export function checkExactVersions(reportError, pkg, types, { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix = false, }) {
    for (const type of types) {
        const pkgDependencies = pkg[type];
        if (!pkgDependencies)
            continue;
        for (const dependencyValue of Object.values(pkgDependencies)) {
            if (!dependencyValue)
                continue;
            checkExactVersion(reportError, dependencyValue, {
                getDependencyPackageJson,
                onlyWarnsForCheck,
                internalExactVersionsIgnore,
                tryToAutoFix,
            });
        }
    }
    reportNotWarnedFor(reportError, onlyWarnsForCheck);
}
//# sourceMappingURL=checkExactVersions.js.map