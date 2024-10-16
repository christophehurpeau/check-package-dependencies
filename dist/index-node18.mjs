import path from 'node:path';
import util from 'node:util';
import chalk from 'chalk';
import semver from 'semver';
import semverUtils from 'semver-utils';
import fs, { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'import-meta-resolve';
import { globSync } from 'glob';

const getKeys = (o) => Object.keys(o);
const getEntries = (o) => Object.entries(o);

let titleDisplayed = null;
let pkgPathDisplayed = null;
let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;
function displayConclusion() {
  if (!totalWarnings && !totalErrors) {
    console.log(`
${chalk.green("\u2705 No errors or warnings found")}.`);
  } else if (!totalErrors) {
    console.log(`
Found ${chalk.yellow(`${totalWarnings} warnings`)}.`);
  } else if (!totalWarnings) {
    console.log(`
Found ${chalk.red(`${totalErrors} errors`)}.`);
  } else {
    console.log(
      `
Found ${chalk.red(`${totalErrors} errors`)} and ${chalk.yellow(
        `${totalWarnings} warnings`
      )}.`
    );
  }
  if (totalFixable) {
    console.log(
      `Found ${chalk.green(
        `${totalFixable} auto-fixable`
      )} errors or warnings, run the command with "--fix" to fix them.`
    );
  }
}
function logMessage(msgTitle, msgInfo, onlyWarns, autoFixable) {
  if (onlyWarns) totalWarnings++;
  else totalErrors++;
  if (autoFixable) totalFixable++;
  console.error(
    `${onlyWarns ? chalk.yellow(`\u26A0 ${msgTitle}`) : chalk.red(`\u274C ${msgTitle}`)}${msgInfo ? `: ${msgInfo}` : ""}${autoFixable ? ` ${chalk.bgGreenBright(chalk.black("auto-fixable"))}` : ""}`
  );
}
function createReportError(title, pkgPathName) {
  return function reportError(msgTitle, msgInfo, onlyWarns, autoFixable = false) {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPathName} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPathName;
    }
    logMessage(msgTitle, msgInfo, onlyWarns, autoFixable);
    if (!onlyWarns) {
      process.exitCode = 1;
    }
  };
}
function reportNotWarnedFor(reportError, onlyWarnsForCheck) {
  const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
  if (notWarnedFor.length > 0) {
    reportError(
      `Invalid config in "${onlyWarnsForCheck.configName}"`,
      `no warning was raised for ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}`,
      false
    );
  }
}
function reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck) {
  const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
  getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
    reportError(
      `Invalid config in "${onlyWarnsForMappingCheck.configName}" for "${depNameOrStar}"`,
      `no warning was raised for ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}`
    );
  });
}

function checkDuplicateDependencies(reportError, pkg, isPkgLibrary, depType, searchIn, depPkg, onlyWarnsForCheck) {
  const dependencies = depPkg[depType];
  if (!dependencies) return;
  const searchInExisting = searchIn.filter((type) => pkg[type]);
  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter((type) => pkg[type][depKey]);
    let allowDuplicated = false;
    if (versionsIn.length === 2 && isPkgLibrary && versionsIn.includes("dependencies") && versionsIn.includes("devDependencies")) {
      const depVersion = pkg.dependencies[depKey];
      const devDepVersion = pkg.devDependencies[depKey];
      if (depVersion && depVersion === devDepVersion) {
        reportError(
          `Invalid "${depKey}" has same version in dependencies and devDependencies`,
          "please place it only in dependencies or use range in dependencies"
        );
        continue;
      }
      allowDuplicated = true;
    }
    if (versionsIn.length > 2 || versionsIn.length === 2 && !allowDuplicated) {
      reportError(
        `Invalid "${depKey}" present in ${versionsIn.join(" and ")}`,
        "please place it only in dependencies"
      );
    } else {
      const versions = versionsIn.map((type) => pkg[type][depKey]);
      versions.forEach((version, index) => {
        if (version.startsWith("file:") || range.startsWith("file:")) return;
        if (version.startsWith("workspace:") || range.startsWith("workspace:")) {
          return;
        }
        if (semver.satisfies(version, range, {
          includePrerelease: true
        }) || semver.intersects(version, range, {
          includePrerelease: true
        })) {
          return;
        }
        if (pkg.resolutions?.[depKey]) {
          return;
        }
        const versionInType = versionsIn[index];
        reportError(
          `Invalid duplicate dependency "${depKey}"`,
          `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`,
          onlyWarnsForCheck.shouldWarnsFor(depKey)
        );
      });
    }
  }
}

async function checkDirectDuplicateDependencies(pkg, pkgPathName, isPackageALibrary, depType, getDependencyPackageJson, onlyWarnsForCheck, reportErrorNamePrefix = "", customCreateReportError = createReportError) {
  const reportError = customCreateReportError(
    `${reportErrorNamePrefix}Direct Duplicate Dependencies`,
    pkgPathName
  );
  const checks = [
    {
      type: "devDependencies",
      searchIn: ["devDependencies", "dependencies"]
    },
    { type: "dependencies", searchIn: ["devDependencies", "dependencies"] }
  ];
  checks.forEach(({ type, searchIn }) => {
    const dependencies = pkg[type];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const depPkg = getDependencyPackageJson(depName);
      checkDuplicateDependencies(
        reportError,
        pkg,
        isPackageALibrary,
        depType,
        searchIn,
        depPkg,
        onlyWarnsForCheck.createFor(depName)
      );
    }
  });
  reportNotWarnedForMapping(reportError, onlyWarnsForCheck);
}

semverUtils.parse;
const parseRange = semverUtils.parseRange;
function stringify(semver) {
  let str = "";
  if (semver.operator) {
    str += semver.operator;
  }
  str += semver.major || "0";
  str += ".";
  str += semver.minor || "0";
  str += ".";
  str += semver.patch || "0";
  if (semver.release) {
    str += `-${semver.release}`;
  }
  if (semver.build) {
    str += `+${semver.build}`;
  }
  return str;
}
function getOperator(range) {
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  return parsedRange[0].operator || "";
}
function changeOperator(range, operator) {
  if (operator === null) return range;
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  const parsed = parsedRange[0];
  parsed.operator = operator === "" ? void 0 : operator;
  return stringify(parsed);
}
function getRealVersion(version) {
  if (version.startsWith("npm:")) {
    const match = /^npm:.*@(.*)$/.exec(version);
    if (!match) throw new Error(`Invalid version match: ${version}`);
    const [, realVersion] = match;
    return realVersion;
  }
  if (version.startsWith("workspace:")) {
    return version.slice("workspace:".length);
  }
  return version;
}

function checkPeerDependencies(pkg, reportError, type, allowedPeerIn, allowMissing, providedDependencies, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
  const { peerDependencies, peerDependenciesMeta } = depPkg;
  if (!peerDependencies) return;
  const allowedPeerInExisting = allowedPeerIn.filter(
    (allowedPeerInType) => pkg[allowedPeerInType]
  );
  for (const [peerDepName, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(
      (allowedPeerInExistingType) => pkg[allowedPeerInExistingType]?.[peerDepName]
    );
    if (versionsIn.length === 0) {
      if (allowMissing) {
        continue;
      }
      const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepName];
      if (peerDependenciesMetaPeerDep?.optional) {
        continue;
      }
      let additionalDetails = "";
      const providedDependenciesForDepName = providedDependencies.filter(
        ([depName]) => depName === peerDepName
      );
      if (providedDependenciesForDepName.length > 0) {
        if (providedDependenciesForDepName.every(
          ([, depRange]) => semver.intersects(range, depRange)
        )) {
          continue;
        }
        additionalDetails += " (required as some dependencies have non-satisfying range too)";
      }
      reportError(
        `Missing "${peerDepName}" peer dependency from "${depPkg.name}" in ${type}`,
        `it should satisfies "${range}" and be in ${allowedPeerIn.join(
          " or "
        )}${additionalDetails}`,
        missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName)
      );
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType][peerDepName]
      );
      versions.forEach((versionValue, index) => {
        const version = getRealVersion(versionValue);
        if (version === "*") {
          return;
        }
        const minVersionOfVersion = semver.minVersion(version);
        if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, range, {
          includePrerelease: true
        })) {
          reportError(
            `Invalid "${peerDepName}" peer dependency`,
            `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`,
            invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName)
          );
        }
      });
    }
  }
}

const regularDependencyTypes = [
  "devDependencies",
  "dependencies",
  "optionalDependencies"
];
const getAllowedPeerInFromType = (depPkgType, isLibrary) => {
  switch (depPkgType) {
    case "devDependencies":
      return ["devDependencies", "dependencies"];
    case "dependencies":
      return isLibrary ? ["dependencies", "peerDependencies"] : ["devDependencies", "dependencies"];
    case "optionalDependencies":
      return isLibrary ? ["dependencies", "optionalDependencies", "peerDependencies"] : ["devDependencies", "dependencies"];
  }
};
async function checkDirectPeerDependencies(isLibrary, pkg, pkgPathName, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck, customCreateReportError = createReportError) {
  const reportError = customCreateReportError("Peer Dependencies", pkgPathName);
  const allDepPkgs = [];
  const allDirectDependenciesDependencies = [];
  await Promise.all(
    regularDependencyTypes.map(async (depType) => {
      const dependencies = pkg[depType];
      if (!dependencies) return;
      for (const depName of getKeys(dependencies)) {
        const depPkg = getDependencyPackageJson(depName);
        allDepPkgs.push({
          name: depName,
          type: depType,
          pkg: depPkg,
          hasDirectMatchingPeerDependency: pkg.peerDependencies?.[depName] ? semver.intersects(
            dependencies[depName],
            pkg.peerDependencies[depName]
          ) : false
        });
        if (depPkg.dependencies && !isLibrary) {
          allDirectDependenciesDependencies.push(
            ...Object.entries(depPkg.dependencies)
          );
        }
      }
    })
  );
  for (const {
    name: depName,
    type: depType,
    pkg: depPkg,
    hasDirectMatchingPeerDependency
  } of allDepPkgs) {
    if (depPkg.peerDependencies) {
      checkPeerDependencies(
        pkg,
        reportError,
        depType,
        getAllowedPeerInFromType(depType, isLibrary),
        hasDirectMatchingPeerDependency,
        allDirectDependenciesDependencies,
        depPkg,
        missingOnlyWarnsForCheck.createFor(depName),
        invalidOnlyWarnsForCheck.createFor(depName)
      );
    }
  }
  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}

const isVersionRange = (version) => version.startsWith("^") || version.startsWith("~") || version.startsWith(">") || version.startsWith("<");
async function checkExactVersions(pkg, pkgPathName, types, {
  getDependencyPackageJson,
  onlyWarnsForCheck,
  internalExactVersionsIgnore,
  tryToAutoFix = false,
  customCreateReportError = createReportError
}) {
  const reportError = customCreateReportError("Exact versions", pkgPathName);
  for (const type of types) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) continue;
    for (const [dependencyName, versionValue] of Object.entries(
      pkgDependencies
    )) {
      const version = getRealVersion(versionValue);
      if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
          continue;
        }
        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
        if (!shouldOnlyWarn && getDependencyPackageJson) {
          let resolvedDep;
          try {
            resolvedDep = getDependencyPackageJson(dependencyName);
          } catch {
            resolvedDep = null;
          }
          if (!resolvedDep?.version) {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact${tryToAutoFix ? `, autofix failed to resolve "${dependencyName}".` : ""}`,
              shouldOnlyWarn,
              false
            );
          } else if (!semver.satisfies(resolvedDep.version, version, {
            includePrerelease: true
          })) {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact${tryToAutoFix ? `, autofix failed as "${dependencyName}"'s resolved version is "${resolvedDep.version}" and doesn't satisfies "${version}".` : ""}`,
              shouldOnlyWarn,
              false
            );
          } else if (tryToAutoFix) {
            pkgDependencies[dependencyName] = resolvedDep.version;
          } else {
            reportError(
              `Unexpected range dependency in "${type}" for "${dependencyName}"`,
              `expecting "${version}" to be exact "${resolvedDep.version}".`,
              shouldOnlyWarn,
              true
            );
          }
        } else {
          let exactVersion = version.slice(version[1] === "=" ? 2 : 1);
          if (exactVersion.split(".").length < 3) {
            if (exactVersion.split(".").length === 1) {
              exactVersion = `${exactVersion}.0.0`;
            } else {
              exactVersion = `${exactVersion}.0`;
            }
          }
          reportError(
            `Unexpected range dependency in "${type}" for "${dependencyName}"`,
            `expecting "${version}" to be exact "${exactVersion}".`,
            shouldOnlyWarn,
            false
          );
        }
      }
    }
  }
  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}

function checkIdenticalVersions(pkg, pkgPathName, type, deps, onlyWarnsForCheck, customCreateReportError = createReportError) {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError(
    "Identical Versions",
    pkgPathName
  );
  getKeys(deps).forEach((depKey) => {
    const version = pkgDependencies[depKey];
    if (!version) {
      reportError(`Unexpected missing ${type} for "${depKey}".`);
      return;
    }
    const depConfigArrayOrObject = deps[depKey];
    const depConfig = Array.isArray(depConfigArrayOrObject) ? { [type]: depConfigArrayOrObject } : depConfigArrayOrObject;
    getKeys(depConfig).forEach((depKeyType) => {
      const pkgDependenciesType = pkg[depKeyType] || {};
      depConfig[depKeyType]?.forEach((depKeyIdentical) => {
        const value = pkgDependenciesType[depKeyIdentical];
        if (!value) {
          reportError(
            `Missing "${depKeyIdentical}" in ${depKeyType}`,
            `it should be "${version}".`,
            onlyWarnsForCheck?.shouldWarnsFor(depKey)
          );
        }
        if (value !== version) {
          reportError(
            `Invalid "${depKeyIdentical}" in ${depKeyType}`,
            `expecting "${value}" be "${version}".`,
            onlyWarnsForCheck?.shouldWarnsFor(depKey)
          );
        }
      });
    });
  });
}

function checkIdenticalVersionsThanDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck, customCreateReportError = createReportError) {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError(
    `Same Versions than ${depPkg.name}`,
    pkgPathName
  );
  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    if (!version) {
      reportError(
        `Unexpected missing dependency "${depKey}" in "${depPkg.name}".`
      );
      return;
    }
    if (version.startsWith("^") || version.startsWith("~")) {
      reportError(
        `Unexpected range dependency in "${depPkg.name}" for "${depKey}"`,
        "perhaps use checkSatisfiesVersionsFromDependency() instead."
      );
      return;
    }
    const value = pkgDependencies[depKey];
    if (!value) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `expecting to be "${version}".`,
        onlyWarnsForCheck?.shouldWarnsFor(depKey)
      );
    }
    if (value !== version) {
      reportError(
        `Invalid "${depKey}" in ${type}`,
        `expecting "${value}" to be "${version}".`,
        onlyWarnsForCheck?.shouldWarnsFor(depKey)
      );
    }
  });
}

function checkMinRangeSatisfies(pkgPathName, pkg, type1 = "dependencies", type2 = "devDependencies", {
  tryToAutoFix = false,
  customCreateReportError = createReportError
} = {}) {
  const dependencies1 = pkg[type1];
  const dependencies2 = pkg[type2];
  if (!dependencies1 || !dependencies2) {
    return;
  }
  const reportError = customCreateReportError(
    `"${type1}" minimum range satisfies "${type2}"`,
    pkgPathName
  );
  for (const [depName, depRange1] of getEntries(dependencies1)) {
    if (depRange1 === "*") continue;
    const depRange2 = dependencies2[depName];
    if (!depRange2 || !depRange1) continue;
    const minDepRange1 = semver.minVersion(depRange1)?.version || depRange1;
    if (!semver.satisfies(minDepRange1, depRange2, {
      includePrerelease: true
    })) {
      if (tryToAutoFix) {
        const depRange1Parsed = semverUtils.parseRange(depRange1);
        dependencies1[depName] = (depRange1Parsed[0]?.operator || "") + (semver.minVersion(depRange2)?.version || depRange2);
      } else {
        reportError(
          `Invalid "${depName}" in ${type1}`,
          `"${depRange1}" should satisfies "${depRange2}" from "${type2}".`,
          false,
          true
        );
      }
    }
  }
}

function checkNoDependencies(pkg, pkgPath, type = "dependencies", moveToSuggestion = "devDependencies", customCreateReportError = createReportError) {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;
  const reportError = customCreateReportError("No dependencies", pkgPath);
  reportError(
    `Unexpected ${type}`,
    `you should move them in ${moveToSuggestion}`
  );
}

function checkResolutionsHasExplanation(pkg, pkgPathName, checkMessage, getDependencyPackageJson, customCreateReportError = createReportError) {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  const reportError = customCreateReportError(
    "Resolutions has explanation",
    pkgPathName
  );
  Object.keys(pkgResolutions).forEach((depKey) => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError(`Missing "${depKey}" in resolutionsExplained.`);
    }
  });
  Object.keys(pkgResolutionsExplained).forEach((depKey) => {
    if (!pkgResolutions[depKey]) {
      reportError(
        `Found "${depKey}" in resolutionsExplained but not in resolutions.`
      );
    } else {
      const error = checkMessage(depKey, pkgResolutionsExplained[depKey], {
        getDependencyPackageJson
      });
      if (error) {
        reportError(
          `Invalid message for "${depKey}" in resolutionsExplained`,
          `${error}.`
        );
      }
    }
  });
}

function checkResolutionsVersionsMatch(pkg, pkgPathName, {
  tryToAutoFix,
  customCreateReportError = createReportError
} = {}) {
  const pkgResolutions = pkg.resolutions || {};
  const reportError = customCreateReportError(
    "Resolutions match other dependencies",
    pkgPathName
  );
  Object.entries(pkgResolutions).forEach(([resolutionKey, resolutionValue]) => {
    let depName = resolutionKey;
    let resolutionDepVersion = resolutionValue;
    if (resolutionValue.startsWith("patch:")) {
      const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(resolutionKey);
      if (matchResolutionInKey) {
        [, depName, resolutionDepVersion] = matchResolutionInKey;
      }
    }
    ["dependencies", "devDependencies"].forEach((depType) => {
      const range = pkg?.[depType]?.[depName];
      if (!range) return;
      if (!semver.satisfies(resolutionDepVersion, range, {
        includePrerelease: true
      })) {
        if (tryToAutoFix) {
          pkg[depType][depName] = resolutionDepVersion;
        } else {
          reportError(
            `Invalid "${depName}" in ${depType}`,
            `expecting "${range}" be "${resolutionDepVersion}" from resolutions.`,
            false,
            true
          );
        }
      }
    });
  });
}

function checkSatisfiesVersions(pkg, pkgPathName, type, dependenciesRanges, onlyWarnsForCheck, {
  customCreateReportError = createReportError
} = {}) {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError(
    "Satisfies Versions",
    pkgPathName
  );
  Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
    const version = pkgDependencies[depKey];
    if (!version) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `should satisfies "${range}".`,
        onlyWarnsForCheck?.shouldWarnsFor(depKey)
      );
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, range, {
        includePrerelease: true
      })) {
        reportError(
          `Invalid "${depKey}" in ${type}`,
          `"${version}" (in "${depKey}") should satisfies "${range}".`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey)
        );
      }
    }
  });
}

function checkSatisfiesVersionsFromDependency(pkg, pkgPathName, type, depKeys, depPkg, depType, {
  tryToAutoFix,
  shouldHaveExactVersions,
  onlyWarnsForCheck,
  customCreateReportError = createReportError
}) {
  const pkgDependencies = pkg[type] || {};
  const dependencies = depPkg[depType] || {};
  const reportError = customCreateReportError(
    `Satisfies Versions from "${depPkg.name}"`,
    pkgPathName
  );
  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];
    if (!range) {
      reportError(
        `Unexpected missing dependency "${depKey}" in "${depPkg.name}"`,
        `config expects "${depKey}" in "${depType}" of "${depPkg.name}".`,
        void 0,
        false
      );
      return;
    }
    const version = pkgDependencies[depKey];
    const getAutoFixIfExists = () => {
      const existingOperator = version ? getOperator(version) : null;
      const expectedOperator = (() => {
        if (existingOperator !== null) {
          return existingOperator;
        }
        return shouldHaveExactVersions(type) ? "" : null;
      })();
      return expectedOperator === "" ? semver.minVersion(range)?.version : changeOperator(range, expectedOperator);
    };
    const autoFix = (versionToApply) => {
      pkg[type] = {
        ...pkg[type],
        [depKey]: versionToApply
      };
    };
    if (!version) {
      const fix = getAutoFixIfExists();
      if (!fix || !tryToAutoFix) {
        reportError(
          `Missing "${depKey}" in "${type}" of "${pkg.name}"`,
          `should satisfies "${range}" from "${depPkg.name}" in "${depType}".`,
          onlyWarnsForCheck?.shouldWarnsFor(depKey),
          !!fix
        );
      } else {
        autoFix(fix);
      }
    } else {
      const minVersionOfVersion = semver.minVersion(version);
      if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, range, {
        includePrerelease: true
      })) {
        const fix = getAutoFixIfExists();
        if (!fix || !tryToAutoFix) {
          reportError(
            `Invalid "${depKey}" in "${type}" of "${pkg.name}"`,
            `"${version}" should satisfies "${range}" from "${depPkg.name}"'s "${depType}".`,
            onlyWarnsForCheck?.shouldWarnsFor(depKey),
            !!fix
          );
        } else {
          autoFix(fix);
        }
      }
    }
  });
}

function checkSatisfiesVersionsInDependency(pkgPathName, depPkg, dependenciesRanges, {
  customCreateReportError = createReportError
} = {}) {
  const reportError = customCreateReportError(
    `Satisfies Versions In Dependency "${depPkg.name}"`,
    pkgPathName
  );
  for (const [dependenciesType, dependenciesTypeRanges] of getEntries(
    dependenciesRanges
  )) {
    if (!dependenciesTypeRanges) return;
    const dependencies = depPkg[dependenciesType];
    for (const [dependencyName, dependencyRange] of getEntries(
      dependenciesTypeRanges
    )) {
      if (dependencyRange == null) {
        if (dependencies?.[dependencyName]) {
          reportError(
            `Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
            "it should not be present"
          );
        }
      } else if (!dependencies) {
        reportError(
          `Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          `"${dependenciesType}" is missing in "${depPkg.name}"`
        );
      } else if (!dependencies[dependencyName]) {
        reportError(
          `Missing "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          `"${dependencyName}" is missing in ${dependenciesType}`
        );
      } else if (!semver.satisfies(dependencies[dependencyName], dependencyRange, {
        includePrerelease: true
      }) && !semver.intersects(dependencies[dependencyName], dependencyRange, {
        includePrerelease: true
      })) {
        reportError(
          `Invalid "${dependencyName}" in ${dependenciesType} of "${depPkg.name}"`,
          `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`
        );
      }
    }
  }
}

function readPkgJson(packagePath) {
  return JSON.parse(readFileSync(packagePath, "utf8"));
}
function writePkgJson(packagePath, pkg) {
  writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}
`);
}
function internalLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname) {
  const packageUrl = resolve(
    `${pkgDepName}/package.json`,
    `file://${pkgDirname}/package.json`
  );
  return readPkgJson(fileURLToPath(packageUrl));
}

function createGetDependencyPackageJson({
  pkgDirname,
  nodeModulesPackagePathCache = /* @__PURE__ */ new Map(),
  internalCustomLoadPackageJsonFromNodeModules = internalLoadPackageJsonFromNodeModules,
  internalReadPkgJson = readPkgJson
}) {
  return (pkgDepName) => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg;
    if (pkgDepName.startsWith(".")) {
      const packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = internalReadPkgJson(packagePath);
    } else {
      try {
        pkg = internalCustomLoadPackageJsonFromNodeModules(
          pkgDepName,
          pkgDirname
        );
      } catch (error) {
        if (!(error instanceof Error)) throw error;
        if (error.code !== "ERR_PACKAGE_PATH_NOT_EXPORTED") {
          throw error;
        }
        const match = / in (.*[/\\]package\.json)\s+imported from/.exec(
          error.message
        );
        if (match) {
          const [, matchPackageJson] = match;
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw error;
        }
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };
}

const createOnlyWarnsForArrayCheck = (configName, onlyWarnsFor = []) => {
  const notWarnedFor = new Set(onlyWarnsFor);
  return {
    configName,
    getNotWarnedFor: () => [...notWarnedFor],
    shouldWarnsFor(dependencyName) {
      if (onlyWarnsFor.includes(dependencyName)) {
        notWarnedFor.delete(dependencyName);
        return true;
      }
      return false;
    }
  };
};
const isMapping = (onlyWarnsFor) => {
  return typeof onlyWarnsFor === "object" && !Array.isArray(onlyWarnsFor);
};
const createOnlyWarnsForMappingCheck = (configName, onlyWarnsFor) => {
  if (isMapping(onlyWarnsFor)) {
    const notWarnedFor = Object.fromEntries(
      getEntries(onlyWarnsFor).map(([entryKey, entryValue]) => [
        entryKey,
        new Set(entryValue)
      ])
    );
    return {
      configName,
      getNotWarnedFor: () => Object.fromEntries(
        getEntries(notWarnedFor).filter(([key, set]) => set.size > 0).map(([key, set]) => [key, [...set]])
      ),
      createFor(dependencyNameLevel1) {
        return {
          configName,
          getNotWarnedFor() {
            throw new Error("Invalid call to getNotWarnedFor()");
          },
          shouldWarnsFor(dependencyName) {
            if (onlyWarnsFor["*"]?.includes(dependencyName)) {
              notWarnedFor["*"].delete(dependencyName);
              return true;
            }
            if (onlyWarnsFor[dependencyNameLevel1]?.includes(dependencyName)) {
              notWarnedFor[dependencyNameLevel1].delete(dependencyName);
              return true;
            }
            return false;
          }
        };
      }
    };
  }
  const arrayOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
    configName,
    onlyWarnsFor
  );
  return {
    configName,
    getNotWarnedFor: () => {
      const notWarnedFor = arrayOnlyWarnsForCheck.getNotWarnedFor();
      if (notWarnedFor.length > 0) {
        return { "*": notWarnedFor };
      }
      return {};
    },
    createFor() {
      return {
        configName,
        getNotWarnedFor() {
          throw new Error("Invalid call to getNotWarnedFor()");
        },
        shouldWarnsFor(dependencyName) {
          return arrayOnlyWarnsForCheck.shouldWarnsFor(dependencyName);
        }
      };
    }
  };
};

function createCheckPackage({
  packageDirectoryPath = ".",
  internalWorkspacePkgDirectoryPath,
  isLibrary = false
} = {}) {
  const pkgDirname = path.resolve(packageDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${packageDirectoryPath}/package.json`;
  const pkg = readPkgJson(pkgPath);
  const copyPkg = JSON.parse(JSON.stringify(pkg));
  const isPkgLibrary = typeof isLibrary === "function" ? isLibrary(pkg) : isLibrary;
  const shouldHaveExactVersions = (depType) => !isPkgLibrary ? true : depType === "devDependencies";
  let tryToAutoFix = false;
  if (process.argv.slice(2).includes("--fix")) {
    tryToAutoFix = true;
  }
  const writePackageIfChanged = () => {
    if (!tryToAutoFix) return;
    if (util.isDeepStrictEqual(pkg, copyPkg)) return;
    writePkgJson(pkgPath, pkg);
  };
  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname
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
      } catch (error) {
        throw new Error(`${this.name} failed: ${error.message}`);
      }
    }
  }
  const jobs = [];
  return {
    async run({
      skipDisplayConclusion = false
    } = {}) {
      runCalled = true;
      for (const job of jobs) {
        await job.run();
      }
      writePackageIfChanged();
      if (!skipDisplayConclusion) {
        displayConclusion();
      }
    },
    pkg,
    pkgDirname,
    pkgPathName,
    isPkgLibrary,
    getDependencyPackageJson,
    checkExactVersions({
      onlyWarnsFor,
      internalExactVersionsIgnore,
      allowRangeVersionsInDependencies = true
    } = {}) {
      jobs.push(
        new Job(this.checkExactVersions.name, async () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactVersions.onlyWarnsFor",
            onlyWarnsFor
          );
          await checkExactVersions(
            pkg,
            pkgPathName,
            !allowRangeVersionsInDependencies ? ["dependencies", "devDependencies", "resolutions"] : ["devDependencies", "resolutions"],
            {
              onlyWarnsForCheck,
              internalExactVersionsIgnore,
              getDependencyPackageJson,
              tryToAutoFix
            }
          );
        })
      );
      return this;
    },
    checkResolutionsVersionsMatch() {
      checkResolutionsVersionsMatch(pkg, pkgPathName, {
        tryToAutoFix
      });
      return this;
    },
    checkExactDevVersions({ onlyWarnsFor } = {}) {
      jobs.push(
        new Job(this.checkExactDevVersions.name, async () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactDevVersions.onlyWarnsFor",
            onlyWarnsFor
          );
          await checkExactVersions(pkg, pkgPathName, ["devDependencies"], {
            onlyWarnsForCheck,
            tryToAutoFix,
            getDependencyPackageJson
          });
        })
      );
      return this;
    },
    checkNoDependencies(type = "dependencies", moveToSuggestion = "devDependencies") {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },
    checkDirectPeerDependencies({
      missingOnlyWarnsFor,
      invalidOnlyWarnsFor,
      internalMissingConfigName = "missingOnlyWarnsFor",
      internalInvalidConfigName = "invalidOnlyWarnsFor"
    } = {}) {
      jobs.push(
        new Job(this.checkDirectPeerDependencies.name, async () => {
          const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
            internalMissingConfigName,
            missingOnlyWarnsFor
          );
          const invalidOnlyWarnsForCheck = internalInvalidConfigName === internalMissingConfigName ? missingOnlyWarnsForCheck : createOnlyWarnsForMappingCheck(
            internalInvalidConfigName,
            invalidOnlyWarnsFor
          );
          await checkDirectPeerDependencies(
            isPkgLibrary,
            pkg,
            pkgPathName,
            getDependencyPackageJson,
            missingOnlyWarnsForCheck,
            invalidOnlyWarnsForCheck
          );
        })
      );
      return this;
    },
    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = "onlyWarnsFor"
    } = {}) {
      jobs.push(
        new Job(this.checkDirectDuplicateDependencies.name, async () => {
          await checkDirectDuplicateDependencies(
            pkg,
            pkgPathName,
            isPkgLibrary,
            "dependencies",
            getDependencyPackageJson,
            createOnlyWarnsForMappingCheck(internalConfigName, onlyWarnsFor)
          );
        })
      );
      return this;
    },
    checkResolutionsHasExplanation(checkMessage = (depKey, message) => void 0) {
      checkResolutionsHasExplanation(
        pkg,
        pkgPathName,
        checkMessage,
        getDependencyPackageJson
      );
      return this;
    },
    checkRecommended({
      onlyWarnsForInPackage,
      onlyWarnsForInDependencies,
      allowRangeVersionsInDependencies = isPkgLibrary,
      internalExactVersionsIgnore,
      checkResolutionMessage
    } = {}) {
      let internalMissingPeerDependenciesOnlyWarnsFor = {};
      let internalInvalidPeerDependenciesOnlyWarnsFor = {};
      let internalDirectDuplicateDependenciesOnlyWarnsFor = {};
      const exactVersionsOnlyWarnsFor = onlyWarnsForInPackage?.exactVersions || [];
      if (onlyWarnsForInDependencies) {
        internalDirectDuplicateDependenciesOnlyWarnsFor = {};
        internalMissingPeerDependenciesOnlyWarnsFor = {};
        internalInvalidPeerDependenciesOnlyWarnsFor = {};
        getEntries(onlyWarnsForInDependencies).forEach(
          ([dependencyNameOrSpecialKey, onlyWarnsForValue]) => {
            if (onlyWarnsForValue.duplicateDirectDependency) {
              internalDirectDuplicateDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.duplicateDirectDependency;
            }
            if (onlyWarnsForValue.missingPeerDependency) {
              internalMissingPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.missingPeerDependency;
            }
            if (onlyWarnsForValue.invalidPeerDependencyVersion) {
              internalInvalidPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.invalidPeerDependencyVersion;
            }
          }
        );
      }
      this.checkExactVersions({
        allowRangeVersionsInDependencies,
        onlyWarnsFor: exactVersionsOnlyWarnsFor,
        internalExactVersionsIgnore
      });
      this.checkResolutionsVersionsMatch();
      this.checkResolutionsHasExplanation(checkResolutionMessage);
      this.checkDirectPeerDependencies({
        missingOnlyWarnsFor: internalMissingPeerDependenciesOnlyWarnsFor,
        invalidOnlyWarnsFor: internalInvalidPeerDependenciesOnlyWarnsFor,
        internalMissingConfigName: "onlyWarnsForInDependencies.missingPeerDependency",
        internalInvalidConfigName: "onlyWarnsForInDependencies.invalidPeerDependencyVersion"
      });
      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
        internalConfigName: "onlyWarnsForInDependencies.duplicateDirectDependency"
      });
      if (isPkgLibrary) {
        this.checkMinRangeDependenciesSatisfiesDevDependencies();
        this.checkMinRangePeerDependenciesSatisfiesDependencies();
      }
      return this;
    },
    checkIdenticalVersionsThanDependency(depName, { resolutions, dependencies, devDependencies }) {
      jobs.push(
        new Job(this.checkIdenticalVersionsThanDependency.name, async () => {
          const depPkg = getDependencyPackageJson(depName);
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.dependencies
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.dependencies
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "devDependencies",
              devDependencies,
              depPkg,
              depPkg.dependencies
            );
          }
        })
      );
      return this;
    },
    checkIdenticalVersionsThanDevDependencyOfDependency(depName, { resolutions, dependencies, devDependencies }) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsFromDependency.name, async () => {
          const depPkg = getDependencyPackageJson(depName);
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.devDependencies
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.devDependencies
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              pkg,
              pkgPathName,
              "devDependencies",
              devDependencies,
              depPkg,
              depPkg.devDependencies
            );
          }
        })
      );
      return this;
    },
    checkSatisfiesVersions(dependencies) {
      Object.entries(dependencies).forEach(
        ([dependencyType, dependenciesRanges]) => {
          checkSatisfiesVersions(
            pkg,
            pkgPathName,
            dependencyType,
            dependenciesRanges
          );
        }
      );
      return this;
    },
    checkSatisfiesVersionsFromDependency(depName, { resolutions, dependencies, devDependencies }) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsFromDependency.name, async () => {
          const depPkg = getDependencyPackageJson(depName);
          if (resolutions) {
            checkSatisfiesVersionsFromDependency(
              pkg,
              pkgPathName,
              "resolutions",
              resolutions,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions }
            );
          }
          if (dependencies) {
            checkSatisfiesVersionsFromDependency(
              pkg,
              pkgPathName,
              "dependencies",
              dependencies,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions }
            );
          }
          if (devDependencies) {
            checkSatisfiesVersionsFromDependency(
              pkg,
              pkgPathName,
              "devDependencies",
              devDependencies,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions }
            );
          }
        })
      );
      return this;
    },
    checkSatisfiesVersionsInDevDependenciesOfDependency(depName, { resolutions, dependencies, devDependencies }) {
      jobs.push(
        new Job(
          this.checkSatisfiesVersionsInDevDependenciesOfDependency.name,
          async () => {
            const depPkg = getDependencyPackageJson(depName);
            if (resolutions) {
              checkSatisfiesVersionsFromDependency(
                pkg,
                pkgPathName,
                "resolutions",
                resolutions,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
            if (dependencies) {
              checkSatisfiesVersionsFromDependency(
                pkg,
                pkgPathName,
                "dependencies",
                dependencies,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
            if (devDependencies) {
              checkSatisfiesVersionsFromDependency(
                pkg,
                pkgPathName,
                "devDependencies",
                devDependencies,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
          }
        )
      );
      return this;
    },
    checkIdenticalVersions({ resolutions, dependencies, devDependencies }) {
      if (resolutions) {
        checkIdenticalVersions(pkg, pkgPathName, "resolutions", resolutions);
      }
      if (dependencies) {
        checkIdenticalVersions(pkg, pkgPathName, "dependencies", dependencies);
      }
      if (devDependencies) {
        checkIdenticalVersions(
          pkg,
          pkgPathName,
          "devDependencies",
          devDependencies
        );
      }
      return this;
    },
    checkSatisfiesVersionsBetweenDependencies(depName1, depName2, { dependencies, devDependencies }) {
      jobs.push(
        new Job(
          this.checkSatisfiesVersionsBetweenDependencies.name,
          async () => {
            const [depPkg1, depPkg2] = await Promise.all([
              getDependencyPackageJson(depName1),
              getDependencyPackageJson(depName2)
            ]);
            if (dependencies) {
              checkSatisfiesVersionsFromDependency(
                depPkg2,
                pkgPathName,
                "dependencies",
                dependencies,
                depPkg1,
                "dependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
            if (devDependencies) {
              checkSatisfiesVersionsFromDependency(
                depPkg2,
                pkgPathName,
                "devDependencies",
                devDependencies,
                depPkg1,
                "dependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
          }
        )
      );
      return this;
    },
    checkSatisfiesVersionsInDependency(depName, dependenciesRanges) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, async () => {
          const depPkg = getDependencyPackageJson(depName);
          checkSatisfiesVersionsInDependency(
            pkgPathName,
            depPkg,
            dependenciesRanges
          );
        })
      );
      return this;
    },
    checkMinRangeDependenciesSatisfiesDevDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, async () => {
          checkMinRangeSatisfies(
            pkgPathName,
            pkg,
            "dependencies",
            "devDependencies",
            { tryToAutoFix }
          );
        })
      );
      return this;
    },
    checkMinRangePeerDependenciesSatisfiesDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, async () => {
          checkMinRangeSatisfies(
            pkgPathName,
            pkg,
            "peerDependencies",
            "dependencies",
            { tryToAutoFix }
          );
        })
      );
      return this;
    }
  };
}

function createCheckPackageWithWorkspaces(createCheckPackageOptions = {}) {
  const checkPackage = createCheckPackage({
    ...createCheckPackageOptions,
    isLibrary: false
  });
  const { pkg, pkgDirname } = checkPackage;
  const pkgWorkspaces = pkg.workspaces && !Array.isArray(pkg.workspaces) ? pkg.workspaces.packages : pkg.workspaces;
  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }
  const workspacePackagesPaths = [];
  if (pkgWorkspaces) {
    pkgWorkspaces.forEach((pattern) => {
      const match = globSync(pattern, { cwd: pkgDirname });
      match.forEach((pathMatch) => {
        if (!fs.existsSync(path.join(pathMatch, "package.json"))) {
          console.log(
            `Ignored potential directory, no package.json found: ${pathMatch}`
          );
          return;
        }
        const subPkgDirectoryPath = path.relative(process.cwd(), pathMatch);
        workspacePackagesPaths.push(subPkgDirectoryPath);
      });
    });
  }
  const checksWorkspaces = new Map(
    workspacePackagesPaths.map((subPkgDirectoryPath) => {
      const checkPkg = createCheckPackage({
        ...createCheckPackageOptions,
        packageDirectoryPath: subPkgDirectoryPath,
        internalWorkspacePkgDirectoryPath: createCheckPackageOptions.packageDirectoryPath || "."
      });
      return [checkPkg.pkg.name, checkPkg];
    })
  );
  return {
    async run() {
      for (const checksWorkspace of [
        checkPackage,
        ...checksWorkspaces.values()
      ]) {
        await checksWorkspace.run({ skipDisplayConclusion: true });
      }
      displayConclusion();
    },
    checkRecommended({
      allowRangeVersionsInLibraries = true,
      onlyWarnsForInRootPackage,
      onlyWarnsForInMonorepoPackages,
      onlyWarnsForInRootDependencies,
      onlyWarnsForInMonorepoPackagesDependencies = {},
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage
    } = {}) {
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        onlyWarnsForInPackage: onlyWarnsForInRootPackage,
        onlyWarnsForInDependencies: onlyWarnsForInRootDependencies,
        checkResolutionMessage
      });
      const monorepoDirectDuplicateDependenciesOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
        "monorepoDirectDuplicateDependenciesOnlyWarnsFor",
        monorepoDirectDuplicateDependenciesOnlyWarnsFor
      );
      const previousCheckedWorkspaces = /* @__PURE__ */ new Map();
      checksWorkspaces.forEach((checkSubPackage, id) => {
        checkSubPackage.checkRecommended({
          allowRangeVersionsInDependencies: checkSubPackage.isPkgLibrary ? allowRangeVersionsInLibraries : false,
          onlyWarnsForInPackage: onlyWarnsForInMonorepoPackages ? {
            ...onlyWarnsForInMonorepoPackages["*"],
            ...onlyWarnsForInMonorepoPackages[checkSubPackage.pkg.name]
          } : void 0,
          onlyWarnsForInDependencies: {
            ...onlyWarnsForInMonorepoPackagesDependencies["*"],
            ...onlyWarnsForInMonorepoPackagesDependencies[checkSubPackage.pkg.name]
          },
          internalExactVersionsIgnore: [...checksWorkspaces.keys()],
          checkResolutionMessage
        });
        const reportMonorepoDDDError = createReportError(
          "Monorepo Direct Duplicate Dependencies",
          checkSubPackage.pkgPathName
        );
        checkDuplicateDependencies(
          reportMonorepoDDDError,
          checkSubPackage.pkg,
          checkSubPackage.isPkgLibrary,
          "devDependencies",
          ["dependencies", "devDependencies"],
          pkg,
          monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
            checkSubPackage.pkg.name
          )
        );
        previousCheckedWorkspaces.forEach((previousCheckSubPackage) => {
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            checkSubPackage.isPkgLibrary,
            "devDependencies",
            ["dependencies", "devDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name
            )
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            checkSubPackage.isPkgLibrary,
            "dependencies",
            ["dependencies", "devDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name
            )
          );
          checkDuplicateDependencies(
            reportMonorepoDDDError,
            checkSubPackage.pkg,
            checkSubPackage.isPkgLibrary,
            "peerDependencies",
            ["peerDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name
            )
          );
        });
        previousCheckedWorkspaces.set(id, checkSubPackage);
      });
      reportNotWarnedForMapping(
        createReportError(
          "Monorepo Direct Duplicate Dependencies",
          checkPackage.pkgPathName
        ),
        monorepoDirectDuplicateDependenciesOnlyWarnsForCheck
      );
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
        throw new Error(
          `Invalid package name: ${id}. Known package names: "${[
            ...checksWorkspaces.keys()
          ].join('","')}"`
        );
      }
      callback(packageCheck);
      return this;
    }
  };
}

export { createCheckPackage, createCheckPackageWithWorkspaces };
//# sourceMappingURL=index-node18.mjs.map
