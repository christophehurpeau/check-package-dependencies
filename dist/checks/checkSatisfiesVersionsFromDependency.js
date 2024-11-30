import semver from "semver";
import { createReportError } from "../utils/createReportError.js";
import { changeOperator, getOperator } from "../utils/semverUtils.js";
export function checkSatisfiesVersionsFromDependency(pkg, pkgPathName, type, depKeys, depPkg, depType, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError = createReportError, }) {
    const pkgDependencies = pkg[type] || {};
    const dependencies = depPkg[depType] || {};
    const reportError = customCreateReportError("Satisfies Versions From Dependency", pkgPathName);
    depKeys.forEach((depKey) => {
        const range = dependencies[depKey];
        if (!range) {
            reportError({
                title: "Unexpected missing dependency",
                info: `config expects "${depKey}" in "${depType}" of "${depPkg.name}"`,
                dependency: { name: depKey, origin: depType },
                onlyWarns: undefined,
                autoFixable: undefined,
            });
            return;
        }
        const version = pkgDependencies[depKey];
        const getAutoFixIfExists = () => {
            const existingOperator = version ? getOperator(version) : null;
            const expectedOperator = (() => {
                if (existingOperator !== null) {
                    return existingOperator;
                }
                return shouldHaveExactVersions(type) ? "" : null;
            })();
            return expectedOperator === ""
                ? semver.minVersion(range)?.version
                : changeOperator(range, expectedOperator);
        };
        const autoFix = (versionToApply) => {
            pkg[type] = {
                ...pkg[type],
                [depKey]: versionToApply,
            };
        };
        if (!version) {
            const fix = getAutoFixIfExists();
            if (!fix || !tryToAutoFix) {
                reportError({
                    title: "Missing dependency",
                    info: `should satisfies "${range}" from "${depPkg.name}" in "${depType}"`,
                    dependency: { name: depKey, origin: type },
                    onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    autoFixable: !!fix,
                });
            }
            else {
                autoFix(fix);
            }
        }
        else {
            const minVersionOfVersion = semver.minVersion(version);
            if (!minVersionOfVersion ||
                !semver.satisfies(minVersionOfVersion, range, {
                    includePrerelease: true,
                })) {
                const fix = getAutoFixIfExists();
                if (!fix || !tryToAutoFix) {
                    reportError({
                        title: "Invalid",
                        info: `"${version}" should satisfies "${range}" from "${depPkg.name}" in "${depType}"`,
                        dependency: { name: depKey, origin: type },
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                        autoFixable: !!fix,
                    });
                }
                else {
                    autoFix(fix);
                }
            }
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.js.map