import { createReportError } from "../utils/createReportError.js";
export function checkNoDependencies(pkg, pkgPath, type = "dependencies", moveToSuggestion = "devDependencies", customCreateReportError = createReportError) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies)
        return;
    const reportError = customCreateReportError("No dependencies", pkgPath);
    reportError({
        title: `Unexpected ${type}`,
        info: `you should move them in ${moveToSuggestion}`,
        autoFixable: false,
    });
}
//# sourceMappingURL=checkNoDependencies.js.map