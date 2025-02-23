export function checkResolutionHasExplanation(reportError, dependencyValue, pkg) {
    if (!pkg.resolutionsExplained?.[dependencyValue.name]) {
        reportError({
            errorMessage: `Missing "${dependencyValue.name}" in "resolutionsExplained"`,
            dependency: dependencyValue,
        });
    }
}
export function checkResolutionExplanation(reportError, dependencyValue, pkg) {
    if (!pkg.resolutions?.[dependencyValue.name]) {
        reportError({
            errorMessage: `Found "${dependencyValue.name}" in "resolutionsExplained" but not in "resolutions"`,
            dependency: dependencyValue,
        });
    }
}
export function checkResolutionsHasExplanation(reportError, pkg, checkMessage, getDependencyPackageJson) {
    const pkgResolutions = pkg.resolutions || {};
    const pkgResolutionsExplained = pkg.resolutionsExplained || {};
    Object.keys(pkgResolutions).forEach((depKey) => {
        if (!pkgResolutionsExplained[depKey]) {
            reportError({
                errorMessage: `Missing "${depKey}" in resolutionsExplained`,
            });
        }
    });
    Object.entries(pkgResolutionsExplained).forEach(([depKey, depValue]) => {
        if (!depValue)
            return;
        if (!pkgResolutions[depKey]) {
            reportError({
                errorMessage: `Found "${depKey}" in resolutionsExplained but not in resolutions`,
            });
        }
        else {
            const error = checkMessage(depKey, depValue.value, {
                getDependencyPackageJson,
            });
            if (error) {
                reportError({
                    errorMessage: "Invalid message",
                    dependency: pkgResolutionsExplained[depKey],
                    errorDetails: error,
                });
            }
        }
    });
}
//# sourceMappingURL=checkResolutionsHasExplanation.js.map