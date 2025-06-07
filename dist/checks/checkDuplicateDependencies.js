import semver from "semver";
export function checkDuplicateDependencies(reportError, pkg, isPkgLibrary, depType, searchIn, depPkg, onlyWarnsForCheck) {
    const dependencies = depPkg[depType];
    if (!dependencies)
        return;
    const searchInExisting = searchIn.filter((type) => pkg[type]);
    for (const [depKey, depRange] of Object.entries(dependencies)) {
        const versionsIn = searchInExisting.filter((type) => pkg[type][depKey]);
        let allowDuplicated = false;
        if (versionsIn.length === 2 &&
            isPkgLibrary &&
            versionsIn.includes("dependencies") &&
            versionsIn.includes("devDependencies")) {
            const depVersion = pkg.dependencies[depKey];
            const devDepVersion = pkg.devDependencies[depKey];
            if (depVersion && depVersion.value === devDepVersion.value) {
                reportError({
                    errorMessage: `Invalid "${depKey}" has same version in dependencies and devDependencies`,
                    errorDetails: "please place it only in dependencies or use range in dependencies",
                    dependency: depVersion,
                });
                continue;
            }
            allowDuplicated = true;
        }
        if (versionsIn.length > 2 ||
            (versionsIn.length === 2 && !allowDuplicated)) {
            reportError({
                errorMessage: `Invalid "${depKey}" present in ${versionsIn.join(" and ")}`,
                errorDetails: "please place it only in dependencies",
            });
        }
        else {
            const versions = versionsIn.map((type) => pkg[type][depKey]);
            versions.forEach((version, index) => {
                if (!version)
                    return;
                const versionValue = version.value;
                if (depRange === "latest")
                    return;
                if (versionValue.startsWith("file:") || depRange.startsWith("file:")) {
                    return;
                }
                // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
                if (versionValue.startsWith("workspace:") ||
                    depRange.startsWith("workspace:")) {
                    return;
                }
                // https://yarnpkg.com/features/patching
                if (versionValue.startsWith("patch:") ||
                    depRange.startsWith("patch:")) {
                    return;
                }
                if (semver.satisfies(versionValue, depRange, {
                    includePrerelease: true,
                }) ||
                    semver.intersects(versionValue, depRange, {
                        includePrerelease: true,
                    })) {
                    return;
                }
                // Ignore reporting duplicate when there's a resolution for it
                if (pkg.resolutions?.[depKey]) {
                    return;
                }
                const versionInType = versionsIn[index];
                reportError({
                    errorMessage: "Invalid duplicate dependency",
                    errorDetails: `"${versions[0].value}" should satisfies "${depRange}" from ${depPkg.name || ""} in ${depType}`,
                    onlyWarns: onlyWarnsForCheck.shouldWarnsFor(depKey),
                    dependency: versionInType ? pkg[versionInType][depKey] : undefined,
                });
            });
        }
    }
}
//# sourceMappingURL=checkDuplicateDependencies.js.map