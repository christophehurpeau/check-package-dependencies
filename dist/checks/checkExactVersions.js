import semver from "semver";
import { createReportError, reportNotWarnedFor, } from "../utils/createReportError.js";
import { getRealVersion } from "../utils/semverUtils.js";
const isVersionRange = (version) => version.startsWith("^") ||
    version.startsWith("~") ||
    version.startsWith(">") ||
    version.startsWith("<");
// eslint-disable-next-line @typescript-eslint/require-await
export async function checkExactVersions(pkg, pkgPathName, types, { getDependencyPackageJson, onlyWarnsForCheck, internalExactVersionsIgnore, tryToAutoFix = false, customCreateReportError = createReportError, }) {
    const reportError = customCreateReportError("Exact versions", pkgPathName);
    for (const type of types) {
        const pkgDependencies = pkg[type];
        if (!pkgDependencies)
            continue;
        for (const [dependencyName, versionValue] of Object.entries(pkgDependencies)) {
            const version = getRealVersion(versionValue);
            if (isVersionRange(version)) {
                if (internalExactVersionsIgnore?.includes(dependencyName)) {
                    continue;
                }
                const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
                if (!shouldOnlyWarn && getDependencyPackageJson) {
                    let resolvedDep;
                    try {
                        resolvedDep = getDependencyPackageJson(dependencyName);
                    }
                    catch {
                        resolvedDep = null;
                    }
                    if (!resolvedDep?.version) {
                        reportError({
                            title: "Unexpected range dependency",
                            info: `expecting "${version}" to be exact${tryToAutoFix
                                ? `, autofix failed to resolve "${dependencyName}"`
                                : ""}`,
                            dependency: { name: dependencyName, origin: type },
                            onlyWarns: shouldOnlyWarn,
                        });
                    }
                    else if (!semver.satisfies(resolvedDep.version, version, {
                        includePrerelease: true,
                    })) {
                        reportError({
                            title: "Unexpected range dependency",
                            info: `expecting "${version}" to be exact${tryToAutoFix
                                ? `, autofix failed as resolved version "${resolvedDep.version}" doesn't satisfy "${version}"`
                                : ""}`,
                            dependency: { name: dependencyName, origin: type },
                            onlyWarns: shouldOnlyWarn,
                        });
                    }
                    else if (tryToAutoFix) {
                        pkgDependencies[dependencyName] = resolvedDep.version;
                    }
                    else {
                        reportError({
                            title: "Unexpected range dependency",
                            info: `expecting "${version}" to be exact "${resolvedDep.version}"`,
                            dependency: { name: dependencyName, origin: type },
                            onlyWarns: shouldOnlyWarn,
                            autoFixable: true,
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
                        title: "Unexpected range dependency",
                        info: `expecting "${version}" to be exact "${exactVersion}"`,
                        dependency: { name: dependencyName, origin: type },
                        onlyWarns: shouldOnlyWarn,
                    });
                }
            }
        }
    }
    reportNotWarnedFor(reportError, onlyWarnsForCheck);
}
//# sourceMappingURL=checkExactVersions.js.map