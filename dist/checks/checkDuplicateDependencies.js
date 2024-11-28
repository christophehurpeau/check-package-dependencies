import semver from "semver";
export function checkDuplicateDependencies(reportError, pkg, isPkgLibrary, depType, searchIn, depPkg, onlyWarnsForCheck) {
    const dependencies = depPkg[depType];
    if (!dependencies)
        return;
    const searchInExisting = searchIn.filter((type) => pkg[type]);
    for (const [depKey, range] of Object.entries(dependencies)) {
        const versionsIn = searchInExisting.filter((type) => pkg[type][depKey]);
        let allowDuplicated = false;
        if (versionsIn.length === 2 &&
            isPkgLibrary &&
            versionsIn.includes("dependencies") &&
            versionsIn.includes("devDependencies")) {
            const depVersion = pkg.dependencies[depKey];
            const devDepVersion = pkg.devDependencies[depKey];
            if (depVersion && depVersion === devDepVersion) {
                reportError(`Invalid "${depKey}" has same version in dependencies and devDependencies`, "please place it only in dependencies or use range in dependencies");
                continue;
            }
            allowDuplicated = true;
        }
        if (versionsIn.length > 2 ||
            (versionsIn.length === 2 && !allowDuplicated)) {
            reportError(`Invalid "${depKey}" present in ${versionsIn.join(" and ")}`, "please place it only in dependencies");
        }
        else {
            const versions = versionsIn.map((type) => pkg[type][depKey]);
            versions.forEach((version, index) => {
                if (version.startsWith("file:") || range.startsWith("file:"))
                    return;
                // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
                if (version.startsWith("workspace:") ||
                    range.startsWith("workspace:")) {
                    return;
                }
                if (semver.satisfies(version, range, {
                    includePrerelease: true,
                }) ||
                    semver.intersects(version, range, {
                        includePrerelease: true,
                    })) {
                    return;
                }
                // Ignore reporting duplicate when there's a resolution for it
                if (pkg.resolutions?.[depKey]) {
                    return;
                }
                const versionInType = versionsIn[index];
                reportError(`Invalid duplicate dependency "${depKey}"`, `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`, onlyWarnsForCheck.shouldWarnsFor(depKey));
            });
        }
    }
}
//# sourceMappingURL=checkDuplicateDependencies.js.map