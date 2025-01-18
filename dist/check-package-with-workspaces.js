import fs, { constants } from "node:fs";
import path from "node:path";
import { createCheckPackage } from "./check-package.js";
import { checkDuplicateDependencies } from "./checks/checkDuplicateDependencies.js";
import { checkMonorepoDirectSubpackagePeerDependencies } from "./checks/checkMonorepoDirectSubpackagePeerDependencies.js";
import { createCliReportError, displayMessages, reportNotWarnedForMapping, } from "./reporting/cliErrorReporting.js";
import { createOnlyWarnsForMappingCheck } from "./utils/warnForUtils.js";
export function createCheckPackageWithWorkspaces({ createReportError = createCliReportError, ...createCheckPackageOptions } = {}) {
    const checkPackage = createCheckPackage({
        createReportError,
        ...createCheckPackageOptions,
        isLibrary: false,
    });
    const { pkg, pkgDirname } = checkPackage;
    const pkgWorkspaces = pkg.workspaces && !Array.isArray(pkg.workspaces)
        ? pkg.workspaces.packages
        : pkg.workspaces;
    if (!pkgWorkspaces) {
        throw new Error('Package is missing "workspaces"');
    }
    const workspacePackagesPaths = [];
    // eslint-disable-next-line n/no-unsupported-features/node-builtins
    const match = fs.globSync(pkgWorkspaces, { cwd: pkgDirname });
    for (const pathMatch of match) {
        try {
            fs.accessSync(path.join(pathMatch, "package.json"), constants.R_OK);
        }
        catch {
            console.log(`Ignored potential directory, no package.json found: ${pathMatch}`);
            continue;
        }
        const subPkgDirectoryPath = path.relative(process.cwd(), pathMatch);
        workspacePackagesPaths.push(subPkgDirectoryPath);
    }
    const checksWorkspaces = new Map(workspacePackagesPaths.map((subPkgDirectoryPath) => {
        const checkPkg = createCheckPackage({
            ...createCheckPackageOptions,
            createReportError,
            packageDirectoryPath: subPkgDirectoryPath,
            internalWorkspacePkgDirectoryPath: createCheckPackageOptions.packageDirectoryPath || ".",
        });
        if (!checkPkg.pkg.name) {
            throw new Error(`Package "${subPkgDirectoryPath}" is missing name`);
        }
        return [checkPkg.pkg.name, checkPkg];
    }));
    return {
        async run() {
            for (const checksWorkspace of [
                checkPackage,
                ...checksWorkspaces.values(),
            ]) {
                await checksWorkspace.run({ skipDisplayMessages: true });
            }
            displayMessages();
        },
        checkRecommended({ allowRangeVersionsInLibraries = true, onlyWarnsForInRootPackage, onlyWarnsForInMonorepoPackages, onlyWarnsForInRootDependencies, onlyWarnsForInMonorepoPackagesDependencies = {}, monorepoDirectDuplicateDependenciesOnlyWarnsFor, monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor, monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor, checkResolutionMessage, } = {}) {
            checkPackage.checkNoDependencies();
            checkPackage.checkRecommended({
                onlyWarnsForInPackage: onlyWarnsForInRootPackage,
                onlyWarnsForInDependencies: onlyWarnsForInRootDependencies,
                checkResolutionMessage,
            });
            const monorepoDirectDuplicateDependenciesOnlyWarnsForCheck = createOnlyWarnsForMappingCheck("monorepoDirectDuplicateDependenciesOnlyWarnsFor", monorepoDirectDuplicateDependenciesOnlyWarnsFor);
            const monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck("monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor", monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor);
            const monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck = createOnlyWarnsForMappingCheck("monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor", monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor);
            const previousCheckedWorkspaces = new Map();
            checksWorkspaces.forEach((checkSubPackage, id) => {
                checkSubPackage.checkRecommended({
                    allowRangeVersionsInDependencies: checkSubPackage.isPkgLibrary
                        ? allowRangeVersionsInLibraries
                        : false,
                    onlyWarnsForInPackage: onlyWarnsForInMonorepoPackages
                        ? {
                            ...onlyWarnsForInMonorepoPackages["*"],
                            ...onlyWarnsForInMonorepoPackages[checkSubPackage.pkg.name],
                        }
                        : undefined,
                    onlyWarnsForInDependencies: {
                        ...onlyWarnsForInMonorepoPackagesDependencies["*"],
                        ...onlyWarnsForInMonorepoPackagesDependencies[checkSubPackage.pkg.name],
                    },
                    internalExactVersionsIgnore: [...checksWorkspaces.keys()],
                    checkResolutionMessage,
                });
                const reportMonorepoDDDError = createReportError("Monorepo Direct Duplicate Dependencies", checkSubPackage.pkgPathName);
                const reportMonorepoDPDError = createReportError(`Monorepo Direct Peer Dependencies for dependencies of "${checkSubPackage.pkg.name}" (${checkSubPackage.pkgPathName})`, checkPackage.pkgPathName);
                // Root
                checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.parsedPkg, checkSubPackage.isPkgLibrary, "devDependencies", ["dependencies", "devDependencies"], pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
                // previous packages
                previousCheckedWorkspaces.forEach((previousCheckSubPackage) => {
                    checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.parsedPkg, checkSubPackage.isPkgLibrary, "devDependencies", ["dependencies", "devDependencies"], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
                    checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.parsedPkg, checkSubPackage.isPkgLibrary, "dependencies", ["dependencies", "devDependencies"], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
                    checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.parsedPkg, checkSubPackage.isPkgLibrary, "peerDependencies", ["peerDependencies"], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
                });
                checkMonorepoDirectSubpackagePeerDependencies(reportMonorepoDPDError, checkSubPackage.isPkgLibrary, checkPackage.parsedPkg, checkSubPackage.parsedPkg, checkSubPackage.getDependencyPackageJson, monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck, monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck);
                previousCheckedWorkspaces.set(id, checkSubPackage);
            });
            reportNotWarnedForMapping(createReportError("Monorepo Direct Duplicate Dependencies", checkPackage.pkgPathName), monorepoDirectDuplicateDependenciesOnlyWarnsForCheck);
            return this;
        },
        forRoot(callback) {
            callback(checkPackage);
            return this;
        },
        forEach(callback) {
            checksWorkspaces.forEach((checkSubPackage) => {
                callback(checkSubPackage);
            });
            return this;
        },
        for(id, callback) {
            const packageCheck = checksWorkspaces.get(id);
            if (!packageCheck) {
                throw new Error(`Invalid package name: ${id}. Known package names: "${[
                    ...checksWorkspaces.keys(),
                ].join('","')}"`);
            }
            callback(packageCheck);
            return this;
        },
    };
}
//# sourceMappingURL=check-package-with-workspaces.js.map