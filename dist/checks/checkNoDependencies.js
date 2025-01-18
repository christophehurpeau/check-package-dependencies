export function checkNoDependencies(reportError, pkg, type = "dependencies", moveToSuggestion = "devDependencies") {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies)
        return;
    reportError({
        errorMessage: `Unexpected ${type}`,
        errorDetails: `you should move them in ${moveToSuggestion}`,
        autoFixable: false,
    });
}
//# sourceMappingURL=checkNoDependencies.js.map