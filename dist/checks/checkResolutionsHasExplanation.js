import { createReportError } from "../utils/createReportError.js";
export function checkResolutionsHasExplanation(pkg, checkMessage, getDependencyPackageJson, customCreateReportError = createReportError) {
    const pkgResolutions = pkg.resolutions || {};
    const pkgResolutionsExplained = pkg.resolutionsExplained || {};
    const reportError = customCreateReportError("Resolutions has explanation", pkg.path);
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