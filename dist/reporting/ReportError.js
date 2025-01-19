export const getLocFromDependency = (dependency, errorTarget) => {
    if (!dependency.locations) {
        return undefined;
    }
    if (errorTarget === "dependencyName") {
        return dependency.locations.name;
    }
    if (errorTarget === "dependencyValue") {
        return dependency.locations.value;
    }
    return dependency.locations.all;
};
//# sourceMappingURL=ReportError.js.map