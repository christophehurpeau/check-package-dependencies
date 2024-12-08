import semver from "semver";
import { createReportError, fromDependency, inDependency, } from "../utils/createReportError.js";
import { changeOperator, getOperator } from "../utils/semverUtils.js";
export function checkSatisfiesVersionsFromDependency(pkg, type, depKeys, depPkg, depType, { tryToAutoFix, shouldHaveExactVersions, onlyWarnsForCheck, customCreateReportError = createReportError, }) {
    const pkgDependencies = pkg[type] || {};
    const dependencies = depPkg[depType] || {};
    const reportError = customCreateReportError("Satisfies Versions From Dependency", pkg.path);
    depKeys.forEach((depKey) => {
        const range = dependencies[depKey];
        if (!range) {
            reportError({
                errorMessage: "Unexpected missing dependency",
                errorDetails: `config expects "${depKey}" ${inDependency(depPkg, depType)}`,
                onlyWarns: undefined,
                autoFixable: undefined,
            });
            return;
        }
        const pkgRange = pkgDependencies[depKey];
        const getAutoFixIfExists = () => {
            const existingOperator = pkgRange ? getOperator(pkgRange.value) : null;
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
        if (!pkgRange) {
            const fix = getAutoFixIfExists();
            if (!fix || !tryToAutoFix) {
                reportError({
                    errorMessage: "Missing dependency",
                    errorDetails: `should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
                    dependency: { name: depKey, fieldName: type },
                    onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                    autoFixable: !!fix,
                });
            }
            else {
                pkg.change(type, depKey, fix);
            }
        }
        else {
            const minVersionOfVersion = semver.minVersion(pkgRange.value);
            if (!minVersionOfVersion ||
                !semver.satisfies(minVersionOfVersion, range, {
                    includePrerelease: true,
                })) {
                const fix = getAutoFixIfExists();
                if (!fix || !tryToAutoFix) {
                    reportError({
                        errorMessage: "Invalid",
                        errorDetails: `"${pkgRange.value}" should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
                        dependency: pkgRange,
                        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
                        autoFixable: !!fix,
                    });
                }
                else {
                    pkgRange.changeValue(fix);
                }
            }
        }
    });
}
//# sourceMappingURL=checkSatisfiesVersionsFromDependency.js.map