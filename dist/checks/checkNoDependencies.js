import { createReportError } from "../utils/createReportError.js";
export function checkNoDependencies(pkg, type = "dependencies", moveToSuggestion = "devDependencies", customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies)
        return;
    const reportError = customCreateReportError("No dependencies", pkg.path);
    reportError({
        errorMessage: `Unexpected ${type}`,
        errorDetails: `you should move them in ${moveToSuggestion}`,
        autoFixable: false,
    });
}
//# sourceMappingURL=checkNoDependencies.js.map