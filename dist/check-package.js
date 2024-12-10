import path from "node:path";
import util from "node:util";
import { checkDirectDuplicateDependencies } from "./checks/checkDirectDuplicateDependencies.js";
import { checkDirectPeerDependencies } from "./checks/checkDirectPeerDependencies.js";
import { checkExactVersions } from "./checks/checkExactVersions.js";
import { checkIdenticalVersions } from "./checks/checkIdenticalVersions.js";
import { checkIdenticalVersionsThanDependency } from "./checks/checkIdenticalVersionsThanDependency.js";
import { checkMinRangeSatisfies } from "./checks/checkMinRangeSatisfies.js";
import { checkNoDependencies } from "./checks/checkNoDependencies.js";
import { checkResolutionsHasExplanation } from "./checks/checkResolutionsHasExplanation.js";
import { checkResolutionsVersionsMatch } from "./checks/checkResolutionsVersionsMatch.js";
import { checkSatisfiesVersions } from "./checks/checkSatisfiesVersions.js";
import { checkSatisfiesVersionsBetweenDependencies } from "./checks/checkSatisfiesVersionsBetweenDependencies.js";
import { checkSatisfiesVersionsFromDependency } from "./checks/checkSatisfiesVersionsFromDependency.js";
import { checkSatisfiesVersionsInDependency } from "./checks/checkSatisfiesVersionsInDependency.js";
import { createGetDependencyPackageJson } from "./utils/createGetDependencyPackageJson.js";
import { displayMessages } from "./utils/createReportError.js";
import { getEntries } from "./utils/object.js";
import { readAndParsePkgJson, writePkgJson } from "./utils/pkgJsonUtils.js";
import { createOnlyWarnsForArrayCheck, createOnlyWarnsForMappingCheck, } from "./utils/warnForUtils.js";
export function createCheckPackage({ packageDirectoryPath = ".", internalWorkspacePkgDirectoryPath, isLibrary = false, } = {}) {
    const pkgDirname = path.resolve(packageDirectoryPath);
    const pkgPath = `${pkgDirname}/package.json`;
    const pkgPathName = `${packageDirectoryPath}/package.json`;
    const parsedPkg = readAndParsePkgJson(pkgPath);
    const copyPkg = JSON.parse(JSON.stringify(parsedPkg));
    const isPkgLibrary = typeof isLibrary === "function" ? isLibrary(parsedPkg.value) : isLibrary;
    const shouldHaveExactVersions = (depType) => !isPkgLibrary ? true : depType === "devDependencies";
    let tryToAutoFix = false;
    if (process.argv.slice(2).includes("--fix")) {
        tryToAutoFix = true;
    }
    const writePackageIfChanged = () => {
        if (!tryToAutoFix)
            return;
        if (util.isDeepStrictEqual(parsedPkg.value, copyPkg))
            return;
        writePkgJson(pkgPath, parsedPkg.value);
    };
    const getDependencyPackageJson = createGetDependencyPackageJson({
        pkgDirname,
    });
    let runCalled = false;
    if (!internalWorkspacePkgDirectoryPath) {
        process.on("beforeExit", () => {
            if (!runCalled) {
                throw new Error("Call .run() and await the result.");
            }
        });
    }
    class Job {
        name;
        fn;
        constructor(name, fn) {
            this.name = name;
            this.fn = fn;
        }
        async run() {
            try {
                await this.fn();
            }
            catch (error) {
                throw new Error(`${this.name} failed: ${error.message}`);
            }
        }
    }
    const jobs = [];
    return {
        async run({ skipDisplayMessages = false } = {}) {
            runCalled = true;
            // TODO parallel
            for (const job of jobs) {
                await job.run();
            }
            if (tryToAutoFix) {
                writePackageIfChanged();
            }
            if (!skipDisplayMessages) {
                displayMessages();
            }
        },
        parsedPkg,
        pkg: parsedPkg.value,
        pkgDirname,
        pkgPathName,
        isPkgLibrary,
        getDependencyPackageJson,
        checkExactVersions({ onlyWarnsFor, internalExactVersionsIgnore, allowRangeVersionsInDependencies = true, } = {}) {
            jobs.push(new Job(this.checkExactVersions.name, async () => {
                const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("checkExactVersions.onlyWarnsFor", onlyWarnsFor);
                await checkExactVersions(parsedPkg, !allowRangeVersionsInDependencies
                    ? ["dependencies", "devDependencies", "resolutions"]
                    : ["devDependencies", "resolutions"], {
                    onlyWarnsForCheck,
                    internalExactVersionsIgnore,
                    getDependencyPackageJson,
                    tryToAutoFix,
                });
            }));
            return this;
        },
        checkResolutionsVersionsMatch() {
            checkResolutionsVersionsMatch(parsedPkg, {
                tryToAutoFix,
            });
            return this;
        },
        checkExactDevVersions({ onlyWarnsFor } = {}) {
            jobs.push(new Job(this.checkExactDevVersions.name, async () => {
                const onlyWarnsForCheck = createOnlyWarnsForArrayCheck("checkExactDevVersions.onlyWarnsFor", onlyWarnsFor);
                await checkExactVersions(parsedPkg, ["devDependencies"], {
                    onlyWarnsForCheck,
                    tryToAutoFix,
                    getDependencyPackageJson,
                });
            }));
            return this;
        },
        checkNoDependencies(type = "dependencies", moveToSuggestion = "devDependencies") {
            checkNoDependencies(parsedPkg, type, moveToSuggestion);
            return this;
        },
        checkDirectPeerDependencies({ missingOnlyWarnsFor, invalidOnlyWarnsFor, internalMissingConfigName = "missingOnlyWarnsFor", internalInvalidConfigName = "invalidOnlyWarnsFor", } = {}) {
            jobs.push(new Job(this.checkDirectPeerDependencies.name, () => {
                const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(internalMissingConfigName, missingOnlyWarnsFor);
                const invalidOnlyWarnsForCheck = internalInvalidConfigName === internalMissingConfigName
                    ? missingOnlyWarnsForCheck
                    : createOnlyWarnsForMappingCheck(internalInvalidConfigName, invalidOnlyWarnsFor);
                checkDirectPeerDependencies(isPkgLibrary, parsedPkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck);
            }));
            return this;
        },
        checkDirectDuplicateDependencies({ onlyWarnsFor, internalConfigName = "onlyWarnsFor", } = {}) {
            jobs.push(new Job(this.checkDirectDuplicateDependencies.name, () => {
                checkDirectDuplicateDependencies(parsedPkg, isPkgLibrary, "dependencies", getDependencyPackageJson, createOnlyWarnsForMappingCheck(internalConfigName, onlyWarnsFor));
            }));
            return this;
        },
        checkResolutionsHasExplanation(checkMessage = (depKey, message) => undefined) {
            checkResolutionsHasExplanation(parsedPkg, checkMessage, getDependencyPackageJson);
            return this;
        },
        checkRecommended({ onlyWarnsForInPackage, onlyWarnsForInDependencies, allowRangeVersionsInDependencies = isPkgLibrary, internalExactVersionsIgnore, checkResolutionMessage, } = {}) {
            let internalMissingPeerDependenciesOnlyWarnsFor = {};
            let internalInvalidPeerDependenciesOnlyWarnsFor = {};
            let internalDirectDuplicateDependenciesOnlyWarnsFor = {};
            const exactVersionsOnlyWarnsFor = onlyWarnsForInPackage?.exactVersions || [];
            if (onlyWarnsForInDependencies) {
                internalDirectDuplicateDependenciesOnlyWarnsFor = {};
                internalMissingPeerDependenciesOnlyWarnsFor = {};
                internalInvalidPeerDependenciesOnlyWarnsFor = {};
                getEntries(onlyWarnsForInDependencies).forEach(([dependencyNameOrSpecialKey, onlyWarnsForValue]) => {
                    if (onlyWarnsForValue.duplicateDirectDependency) {
                        internalDirectDuplicateDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] =
                            onlyWarnsForValue.duplicateDirectDependency;
                    }
                    if (onlyWarnsForValue.missingPeerDependency) {
                        internalMissingPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] =
                            onlyWarnsForValue.missingPeerDependency;
                    }
                    if (onlyWarnsForValue.invalidPeerDependencyVersion) {
                        internalInvalidPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] =
                            onlyWarnsForValue.invalidPeerDependencyVersion;
                    }
                });
            }
            this.checkExactVersions({
                allowRangeVersionsInDependencies,
                onlyWarnsFor: exactVersionsOnlyWarnsFor,
                internalExactVersionsIgnore,
            });
            this.checkResolutionsVersionsMatch();
            this.checkResolutionsHasExplanation(checkResolutionMessage);
            this.checkDirectPeerDependencies({
                missingOnlyWarnsFor: internalMissingPeerDependenciesOnlyWarnsFor,
                invalidOnlyWarnsFor: internalInvalidPeerDependenciesOnlyWarnsFor,
                internalMissingConfigName: "onlyWarnsForInDependencies.missingPeerDependency",
                internalInvalidConfigName: "onlyWarnsForInDependencies.invalidPeerDependencyVersion",
            });
            this.checkDirectDuplicateDependencies({
                onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
                internalConfigName: "onlyWarnsForInDependencies.duplicateDirectDependency",
            });
            if (isPkgLibrary) {
                this.checkMinRangeDependenciesSatisfiesDevDependencies();
                this.checkMinRangePeerDependenciesSatisfiesDependencies();
            }
            return this;
        },
        checkIdenticalVersionsThanDependency(depName, { resolutions, dependencies, devDependencies }) {
            jobs.push(new Job(this.checkIdenticalVersionsThanDependency.name, () => {
                const [depPkg] = getDependencyPackageJson(depName);
                if (resolutions) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "resolutions", resolutions, depPkg, depPkg.dependencies);
                }
                if (dependencies) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "dependencies", dependencies, depPkg, depPkg.dependencies);
                }
                if (devDependencies) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "devDependencies", devDependencies, depPkg, depPkg.dependencies);
                }
            }));
            return this;
        },
        checkIdenticalVersionsThanDevDependencyOfDependency(depName, { resolutions, dependencies, devDependencies }) {
            jobs.push(new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
                const [depPkg] = getDependencyPackageJson(depName);
                if (resolutions) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "resolutions", resolutions, depPkg, depPkg.devDependencies);
                }
                if (dependencies) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "dependencies", dependencies, depPkg, depPkg.devDependencies);
                }
                if (devDependencies) {
                    checkIdenticalVersionsThanDependency(parsedPkg, "devDependencies", devDependencies, depPkg, depPkg.devDependencies);
                }
            }));
            return this;
        },
        checkSatisfiesVersions(dependencies) {
            Object.entries(dependencies).forEach(([dependencyType, dependenciesRanges]) => {
                checkSatisfiesVersions(parsedPkg, dependencyType, dependenciesRanges);
            });
            return this;
        },
        checkSatisfiesVersionsFromDependency(depName, { resolutions, dependencies, devDependencies }) {
            jobs.push(new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
                const [depPkg] = getDependencyPackageJson(depName);
                if (resolutions) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "resolutions", resolutions, depPkg, "dependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
                if (dependencies) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "dependencies", dependencies, depPkg, "dependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
                if (devDependencies) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "devDependencies", devDependencies, depPkg, "dependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
            }));
            return this;
        },
        checkSatisfiesVersionsInDevDependenciesOfDependency(depName, { resolutions, dependencies, devDependencies }) {
            jobs.push(new Job(this.checkSatisfiesVersionsInDevDependenciesOfDependency.name, () => {
                const [depPkg] = getDependencyPackageJson(depName);
                if (resolutions) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "resolutions", resolutions, depPkg, "devDependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
                if (dependencies) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "dependencies", dependencies, depPkg, "devDependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
                if (devDependencies) {
                    checkSatisfiesVersionsFromDependency(parsedPkg, "devDependencies", devDependencies, depPkg, "devDependencies", { tryToAutoFix, shouldHaveExactVersions });
                }
            }));
            return this;
        },
        checkIdenticalVersions({ resolutions, dependencies, devDependencies }) {
            if (resolutions) {
                checkIdenticalVersions(parsedPkg, "resolutions", resolutions);
            }
            if (dependencies) {
                checkIdenticalVersions(parsedPkg, "dependencies", dependencies);
            }
            if (devDependencies) {
                checkIdenticalVersions(parsedPkg, "devDependencies", devDependencies);
            }
            return this;
        },
        checkSatisfiesVersionsBetweenDependencies(config) {
            jobs.push(new Job(this.checkSatisfiesVersionsBetweenDependencies.name, async () => {
                const depNamesLvl1 = Object.keys(config);
                const depNamesLvl2 = Object.values(config).flatMap((depConfig) => [
                    ...Object.keys(depConfig.dependencies || {}),
                    ...Object.keys(depConfig.devDependencies || {}),
                ]);
                const uniqueDepNames = [
                    ...new Set([...depNamesLvl1, ...depNamesLvl2]),
                ];
                const depPkgsByName = new Map(await Promise.all(uniqueDepNames.map((depName) => [depName, getDependencyPackageJson(depName)])));
                Object.entries(config).forEach(([depName1, depConfig1]) => {
                    const [depPkg1, depPkgPath1] = depPkgsByName.get(depName1);
                    ["dependencies", "devDependencies"].forEach((dep1Type) => {
                        Object.entries(depConfig1[dep1Type] || {}).forEach(([depName2, depConfig2]) => {
                            if (!depConfig2)
                                return;
                            const [depPkg2] = depPkgsByName.get(depName2);
                            ["dependencies", "devDependencies"].forEach((dep2Type) => {
                                checkSatisfiesVersionsBetweenDependencies(depPkgPath1, depPkg1, dep1Type, depConfig2[dep2Type] || [], depPkg2, dep2Type, { shouldHaveExactVersions });
                            });
                        });
                    });
                });
            }));
            return this;
        },
        checkSatisfiesVersionsInDependency(depName, dependenciesRanges) {
            jobs.push(new Job(this.checkSatisfiesVersionsInDependency.name, () => {
                const [depPkg] = getDependencyPackageJson(depName);
                checkSatisfiesVersionsInDependency(pkgPathName, depPkg, dependenciesRanges);
            }));
            return this;
        },
        checkMinRangeDependenciesSatisfiesDevDependencies() {
            jobs.push(new Job(this.checkSatisfiesVersionsInDependency.name, () => {
                checkMinRangeSatisfies(parsedPkg, "dependencies", "devDependencies", {
                    tryToAutoFix,
                });
            }));
            return this;
        },
        checkMinRangePeerDependenciesSatisfiesDependencies() {
            jobs.push(new Job(this.checkSatisfiesVersionsInDependency.name, () => {
                checkMinRangeSatisfies(parsedPkg, "peerDependencies", "dependencies", {
                    tryToAutoFix,
                });
            }));
            return this;
        },
    };
}
//# sourceMappingURL=check-package.js.map