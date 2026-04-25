import path from 'node:path';
import util, { styleText } from 'node:util';
import semver from 'semver';
import semverUtils from 'semver-utils';
import fs, { readFileSync, writeFileSync, constants } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { parseTree, findNodeAtLocation, getNodeValue } from 'jsonc-parser';

const getKeys = (o) => Object.keys(o);
const getEntries = (o) => Object.entries(o);

const getLocFromDependency = (dependency, errorTarget) => {
  if (!dependency.locations) {
    return void 0;
  }
  if (errorTarget === "dependencyName") {
    return dependency.locations.name;
  }
  if (errorTarget === "dependencyValue") {
    return dependency.locations.value;
  }
  return dependency.locations.all;
};

const pathMessages = /* @__PURE__ */ new Map();
let totalWarnings = 0;
let totalErrors = 0;
let totalFixable = 0;
function formatErrorMessage({
  errorMessage,
  errorDetails,
  errorTarget,
  onlyWarns,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  autoFixable,
  fixTo,
  ruleName,
  dependency
}) {
  const location = dependency && getLocFromDependency(dependency, errorTarget);
  const locationString = location ? `${location.start.line}:${location.start.column || 0}` : "0:0";
  const messageType = onlyWarns ? styleText("yellow", "warning") : styleText("red", "error");
  const dependencyInfo = dependency ? styleText(
    "dim",
    `${dependency.fieldName ? `${dependency.fieldName} > ` : ""}${dependency.name} `
  ) : "";
  const details = errorDetails ? `: ${errorDetails}` : "";
  const messageTitle = onlyWarns ? styleText("yellow", errorMessage) : styleText("red", errorMessage);
  const isFixable = autoFixable || fixTo;
  return `  ${locationString}  ${messageType}  ${dependencyInfo}${messageTitle}${details}  ${styleText("blue", ruleName)}${isFixable ? styleText("dim", " (--fix)") : ""}`;
}
function logMessage(message) {
  if (message.onlyWarns) totalWarnings++;
  else totalErrors++;
  if (message.autoFixable || message.fixTo) totalFixable++;
  console.error(formatErrorMessage(message));
}
function displayMessagesForPath(path, {
  generalMessages,
  dependencyGroups
}) {
  console.error(styleText("underline", path));
  if (generalMessages.length > 0) {
    for (const message of generalMessages) {
      logMessage(message);
    }
  }
  for (const [, group] of dependencyGroups) {
    for (const message of group.messages) {
      logMessage(message);
    }
  }
  console.error();
}
function displayConclusion() {
  if (!totalWarnings && !totalErrors) {
    console.log(styleText("green", "\n\u2728 No problems found"));
    return;
  }
  const problems = [];
  if (totalErrors) {
    problems.push(
      styleText(
        "red",
        `${totalErrors} ${totalErrors === 1 ? "error" : "errors"}`
      )
    );
  }
  if (totalWarnings) {
    problems.push(
      styleText(
        "yellow",
        `${totalWarnings} ${totalWarnings === 1 ? "warning" : "warnings"}`
      )
    );
  }
  console.log(`
\u2716 Found ${problems.join(" and ")}`);
  if (totalFixable) {
    console.log(
      styleText(
        "dim",
        `
${totalFixable} ${totalFixable === 1 ? "issue" : "issues"} fixable with the --fix option`
      )
    );
  }
}
function displayMessages() {
  for (const [path, pathData] of pathMessages) {
    displayMessagesForPath(path, pathData);
  }
  displayConclusion();
}
function createCliReportError(ruleName, pkgPathName) {
  return function reportError(message) {
    let pathData = pathMessages.get(pkgPathName);
    if (!pathData) {
      pathData = {
        generalMessages: [],
        dependencyGroups: /* @__PURE__ */ new Map()
      };
      pathMessages.set(pkgPathName, pathData);
    }
    if (message.dependency) {
      const dependencyKey = `${message.dependency.fieldName ? `${message.dependency.fieldName} > ` : ""}${message.dependency.name}`;
      let group = pathData.dependencyGroups.get(dependencyKey);
      if (!group) {
        group = { messages: [] };
        pathData.dependencyGroups.set(dependencyKey, group);
      }
      group.messages.push({ ...message, ruleName });
    } else {
      pathData.generalMessages.push({ ...message, ruleName });
    }
    if (!message.onlyWarns) {
      process.exitCode = 1;
    }
  };
}
function reportNotWarnedFor(reportError, onlyWarnsForCheck) {
  const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();
  if (notWarnedFor.length > 0) {
    reportError({
      errorMessage: `Invalid config in "${onlyWarnsForCheck.configName}"`,
      errorDetails: `no warning was raised for ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}`
    });
  }
}
function reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck) {
  const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
  getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
    reportError({
      errorMessage: `Invalid config in "${onlyWarnsForMappingCheck.configName}"`,
      errorDetails: `no warning was raised for ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}`
    });
  });
}
function fromDependency(depPkg, depType) {
  return `from "${depPkg.name || ""}"${depType ? ` in "${depType}"` : ""}`;
}
function inDependency(depPkg, depType) {
  return `in ${depType ? `"${depType}" of ` : ""}"${depPkg.name || ""}"`;
}

function checkDuplicateDependencies(reportError, pkg, isPkgLibrary, depType, searchIn, depPkg, onlyWarnsForCheck) {
  const dependencies = depPkg[depType];
  if (!dependencies) return;
  const searchInExisting = searchIn.filter((type) => pkg[type]);
  for (const [depKey, depRange] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter((type) => pkg[type][depKey]);
    let allowDuplicated = false;
    if (versionsIn.length === 2 && isPkgLibrary && versionsIn.includes("dependencies") && versionsIn.includes("devDependencies")) {
      const depVersion = pkg.dependencies[depKey];
      const devDepVersion = pkg.devDependencies[depKey];
      if (depVersion?.value === devDepVersion.value) {
        reportError({
          errorMessage: `Invalid "${depKey}" has same version in dependencies and devDependencies`,
          errorDetails: "please place it only in dependencies or use range in dependencies",
          dependency: depVersion
        });
        continue;
      }
      allowDuplicated = true;
    }
    if (versionsIn.length > 2 || versionsIn.length === 2 && !allowDuplicated) {
      reportError({
        errorMessage: `Invalid "${depKey}" present in ${versionsIn.join(" and ")}`,
        errorDetails: "please place it only in dependencies"
      });
    } else {
      const versions = versionsIn.map((type) => pkg[type][depKey]);
      versions.forEach((version, index) => {
        if (!version) return;
        const versionValue = version.value;
        if (depRange === "latest") return;
        if (versionValue.startsWith("file:") || depRange.startsWith("file:")) {
          return;
        }
        if (versionValue.startsWith("workspace:") || depRange.startsWith("workspace:")) {
          return;
        }
        if (versionValue.startsWith("patch:") || depRange.startsWith("patch:")) {
          return;
        }
        if (semver.satisfies(versionValue, depRange, {
          includePrerelease: true
        }) || semver.intersects(versionValue, depRange, {
          includePrerelease: true
        })) {
          return;
        }
        if (pkg.resolutions?.[depKey]) {
          return;
        }
        const versionInType = versionsIn[index];
        const dependency = versionInType ? pkg[versionInType][depKey] : void 0;
        reportError({
          errorMessage: `Invalid duplicate dependency${dependency ? "" : `"${depKey}"`}`,
          errorDetails: `"${versions[0].value}" should satisfies "${depRange}" from ${depPkg.name || ""} in ${depType}`,
          onlyWarns: onlyWarnsForCheck.shouldWarnsFor(depKey),
          dependency
        });
      });
    }
  }
}

function checkDirectDuplicateDependencies(reportError, pkg, isPackageALibrary, depType, getDependencyPackageJson, onlyWarnsForCheck) {
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
      const [depPkg] = getDependencyPackageJson(depName);
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
  return parsedRange[0]?.operator || "";
}
function changeOperator(range, operator) {
  if (operator === null) return range;
  const parsedRange = parseRange(range);
  if (parsedRange.length !== 1) return null;
  const parsed = parsedRange[0];
  if (!parsed) return null;
  parsed.operator = operator === "" ? void 0 : operator;
  return stringify(parsed);
}
function getRealVersion(version) {
  if (version.startsWith("npm:")) {
    const match = /^npm:@?[^@]+@(.*)$/.exec(version);
    if (!match) throw new Error(`Invalid version match: ${version}`);
    const [, realVersion] = match;
    if (realVersion) return realVersion;
  }
  if (version.startsWith("workspace:")) {
    return version.slice("workspace:".length);
  }
  return version;
}

function checkSatisfiesPeerDependency(reportError, pkg, type, allowedPeerIn, peerDepName, range, depPkg, invalidOnlyWarnsForCheck) {
  const versions = allowedPeerIn.map(
    (versionsInType) => pkg[versionsInType]?.[peerDepName]
  );
  versions.forEach((versionV, index) => {
    if (!versionV) {
      return;
    }
    const version = getRealVersion(versionV.value);
    if (version === "*" || version.startsWith("patch:")) {
      return;
    }
    const minVersionOfVersion = semver.minVersion(version);
    if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, range, {
      includePrerelease: true,
      loose: true
    })) {
      reportError({
        errorMessage: "Invalid peer dependency version",
        errorDetails: `"${version}" should satisfies "${range}" ${fromDependency(depPkg, type)}`,
        dependency: allowedPeerIn[index] ? pkg[allowedPeerIn[index]]?.[peerDepName] ?? void 0 : void 0,
        onlyWarns: invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName)
      });
    }
  });
}
function checkPeerDependencies(reportError, pkg, type, allowedPeerIn, allowMissing, providedDependencies, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
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
          if (process.env.REPORT_PROVIDED_PEER_DEPENDENCIES) {
            reportError({
              errorMessage: `Missing "${peerDepName}" peer dependency ${fromDependency(depPkg, type)}`,
              errorDetails: `but it is provided by ${providedDependenciesForDepName.map(([depName, depRange, depPkgName]) => depPkgName).join(", ")}`,
              dependency: { name: peerDepName },
              onlyWarns: process.env.REPORT_PROVIDED_PEER_DEPENDENCIES === "warn"
            });
          }
          continue;
        }
        additionalDetails += " (required as some dependencies have non-satisfying range too)";
      }
      reportError({
        errorMessage: `Missing "${peerDepName}" peer dependency ${fromDependency(depPkg, type)}`,
        errorDetails: `it should satisfies "${range}" and be in ${allowedPeerIn.join(" or ")}${additionalDetails}`,
        dependency: { name: peerDepName },
        onlyWarns: missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName)
      });
    } else {
      checkSatisfiesPeerDependency(
        reportError,
        pkg,
        type,
        allowedPeerInExisting,
        peerDepName,
        range,
        depPkg,
        invalidOnlyWarnsForCheck
      );
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
function checkDirectPeerDependencies(reportError, isLibrary, pkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
  const allDepPkgs = [];
  const allDirectDependenciesDependencies = [];
  regularDependencyTypes.forEach((depType) => {
    const dependencies = pkg[depType];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const [depPkg] = getDependencyPackageJson(depName);
      allDepPkgs.push({
        name: depName,
        type: depType,
        pkg: depPkg,
        hasDirectMatchingPeerDependency: pkg.peerDependencies?.[depName] ? semver.intersects(
          dependencies[depName].value,
          pkg.peerDependencies[depName].value
        ) : false
      });
      if (depPkg.dependencies && !isLibrary) {
        allDirectDependenciesDependencies.push(
          ...Object.entries(depPkg.dependencies).map(
            ([depName2, depVersion]) => [depName2, depVersion, depPkg.name || ""]
          )
        );
      }
    }
  });
  for (const {
    name: depName,
    type: depType,
    pkg: depPkg,
    hasDirectMatchingPeerDependency
  } of allDepPkgs) {
    if (depPkg.peerDependencies) {
      checkPeerDependencies(
        reportError,
        pkg,
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
}

const isVersionRange = (version) => version.startsWith("^") || version.startsWith("~") || version.startsWith(">") || version.startsWith("<");
function checkExactVersion(reportError, dependencyValue, {
  getDependencyPackageJson,
  onlyWarnsForCheck,
  internalExactVersionsIgnore,
  tryToAutoFix = false
}) {
  const dependencyName = dependencyValue.name;
  const version = getRealVersion(dependencyValue.value);
  if (isVersionRange(version)) {
    if (internalExactVersionsIgnore?.includes(dependencyName)) {
      return;
    }
    const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);
    if (!shouldOnlyWarn && getDependencyPackageJson) {
      let resolvedDep;
      try {
        [resolvedDep] = getDependencyPackageJson(dependencyName);
      } catch {
        resolvedDep = null;
      }
      if (!resolvedDep?.version) {
        reportError({
          errorMessage: "Unexpected range value",
          errorDetails: `expecting "${version}" to be exact${tryToAutoFix ? `, autofix failed to resolve "${dependencyName}"` : ""}`,
          errorTarget: "dependencyValue",
          dependency: dependencyValue,
          onlyWarns: shouldOnlyWarn
        });
      } else if (!semver.satisfies(resolvedDep.version, version, {
        includePrerelease: true
      })) {
        reportError({
          errorMessage: "Unexpected range value",
          errorDetails: `expecting "${version}" to be exact${tryToAutoFix ? `, autofix failed as resolved version "${resolvedDep.version}" doesn't satisfy "${version}"` : ""}`,
          dependency: dependencyValue,
          errorTarget: "dependencyValue",
          onlyWarns: shouldOnlyWarn
        });
      } else if (tryToAutoFix) {
        dependencyValue.changeValue(resolvedDep.version);
      } else {
        reportError({
          errorMessage: "Unexpected range value",
          errorDetails: `expecting "${version}" to be exact "${resolvedDep.version}"`,
          dependency: dependencyValue,
          errorTarget: "dependencyValue",
          onlyWarns: shouldOnlyWarn,
          fixTo: resolvedDep.version
        });
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
      reportError({
        errorMessage: "Unexpected range value",
        errorDetails: `expecting "${version}" to be exact "${exactVersion}"`,
        errorTarget: "dependencyValue",
        dependency: dependencyValue,
        onlyWarns: shouldOnlyWarn
      });
    }
  }
}
function checkExactVersions(reportError, pkg, types, {
  getDependencyPackageJson,
  onlyWarnsForCheck,
  internalExactVersionsIgnore,
  tryToAutoFix = false
}) {
  for (const type of types) {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) continue;
    for (const dependencyValue of Object.values(pkgDependencies)) {
      if (!dependencyValue) continue;
      checkExactVersion(reportError, dependencyValue, {
        getDependencyPackageJson,
        onlyWarnsForCheck,
        internalExactVersionsIgnore,
        tryToAutoFix
      });
    }
  }
  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}

function checkIdenticalVersions(reportError, pkg, type, deps, onlyWarnsForCheck) {
  const pkgDependencies = pkg[type] || {};
  getKeys(deps).forEach((depKey) => {
    const version = pkgDependencies[depKey]?.value;
    if (!version) {
      reportError({
        errorMessage: `Unexpected missing ${type}`,
        errorDetails: `missing "${depKey}"`
      });
      return;
    }
    const depConfigArrayOrObject = deps[depKey];
    const depConfig = Array.isArray(depConfigArrayOrObject) ? { [type]: depConfigArrayOrObject } : depConfigArrayOrObject;
    if (!depConfig) {
      throw new Error(`depConfig is undefined for ${depKey}`);
    }
    getKeys(depConfig).forEach((depKeyType) => {
      const pkgDependenciesType = pkg[depKeyType] || {};
      depConfig[depKeyType]?.forEach((depKeyIdentical) => {
        const depValue = pkgDependenciesType[depKeyIdentical];
        const value = depValue?.value;
        if (!value) {
          reportError({
            errorMessage: `Missing "${depKeyIdentical}" in "${depKeyType}"`,
            errorDetails: `it should be "${version}" identical to "${depKey}" in "${type}"`,
            dependency: { name: depKeyIdentical, fieldName: depKeyType },
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
          });
          return;
        }
        if (value !== version) {
          reportError({
            errorMessage: `Invalid "${depKeyIdentical}"`,
            errorDetails: `expecting "${value}" to be "${version}" identical to "${depKey}" in "${type}"`,
            dependency: depValue,
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
          });
        }
      });
    });
  });
}

function checkIdenticalVersionsThanDependency(reportError, pkg, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck) {
  const pkgDependencies = pkg[type] || {};
  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    const depValue = pkgDependencies[depKey];
    if (!version) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(depPkg)}`,
        errorDetails: `config expects "${depKey}" to be present`
      });
      return;
    }
    if (version.startsWith("^") || version.startsWith("~")) {
      reportError({
        errorMessage: `Unexpected range dependency "${depKey}" ${inDependency(depPkg)}`,
        errorDetails: "perhaps use checkSatisfiesVersionsFromDependency() instead"
      });
      return;
    }
    const value = depValue?.value;
    if (!value) {
      reportError({
        errorMessage: `Missing "${depKey}"`,
        errorDetails: `expecting to be "${version}"`,
        dependency: { name: depKey, fieldName: type },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
      });
      return;
    }
    if (value !== version) {
      reportError({
        errorMessage: `Invalid "${value}"`,
        errorDetails: `expecting "${value}" to be "${version}" ${fromDependency(depPkg)}`,
        dependency: depValue,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
      });
    }
  });
}

function checkMinRangeSatisfies(reportError, pkg, type1 = "dependencies", type2 = "devDependencies", { tryToAutoFix = false } = {}) {
  const dependencies1 = pkg[type1];
  const dependencies2 = pkg[type2];
  if (!dependencies1 || !dependencies2) {
    return;
  }
  for (const [depName, depRange1] of getEntries(dependencies1)) {
    if (!depRange1 || depRange1.value === "*") continue;
    const depRange2 = dependencies2[depName];
    if (!depRange2) continue;
    const minDepRange1 = semver.minVersion(depRange1.value)?.version || depRange1.value;
    if (!semver.satisfies(minDepRange1, depRange2.value, {
      includePrerelease: true
    })) {
      if (tryToAutoFix) {
        const depRange1Parsed = semverUtils.parseRange(depRange1.value);
        depRange1.changeValue(
          (depRange1Parsed[0]?.operator || "") + (semver.minVersion(depRange2.value)?.version || depRange2.value)
        );
      } else {
        reportError({
          errorMessage: `Invalid "${depRange1.value}" in "${type1}"`,
          errorDetails: `"${depRange1.value}" should satisfies "${depRange2.value}" from "${type2}"`,
          dependency: depRange1,
          autoFixable: true
        });
      }
    }
  }
}

function checkNoDependencies(reportError, pkg, type = "dependencies", moveToSuggestion = "devDependencies") {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;
  reportError({
    errorMessage: `Unexpected ${type}`,
    errorDetails: `you should move them in ${moveToSuggestion}`,
    autoFixable: false
  });
}

function checkResolutionsHasExplanation(reportError, pkg, checkMessage, getDependencyPackageJson) {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  Object.keys(pkgResolutions).forEach((depKey) => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError({
        errorMessage: `Missing "${depKey}" in resolutionsExplained`
      });
    }
  });
  Object.entries(pkgResolutionsExplained).forEach(([depKey, depValue]) => {
    if (!depValue) return;
    if (!pkgResolutions[depKey]) {
      reportError({
        errorMessage: `Found "${depKey}" in resolutionsExplained but not in resolutions`
      });
    } else {
      const error = checkMessage(depKey, depValue.value, {
        getDependencyPackageJson
      });
      if (error) {
        reportError({
          errorMessage: "Invalid message",
          dependency: pkgResolutionsExplained[depKey],
          errorDetails: error
        });
      }
    }
  });
}

function checkResolutionVersionMatch(reportError, pkg, resolutionValue, { tryToAutoFix } = {}) {
  let depName = resolutionValue.name;
  let resolutionDepVersion = resolutionValue.value;
  if (!resolutionDepVersion) return;
  if (resolutionDepVersion.startsWith("patch:")) {
    const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(depName);
    if (matchResolutionInKey?.[1] && matchResolutionInKey[2]) {
      depName = matchResolutionInKey[1];
      resolutionDepVersion = matchResolutionInKey[2];
    }
  }
  ["dependencies", "devDependencies"].forEach((depType) => {
    const range = pkg[depType]?.[depName];
    if (!range) return;
    if (!semver.satisfies(resolutionDepVersion, range.value, {
      includePrerelease: true
    })) {
      if (tryToAutoFix) {
        range.changeValue(resolutionDepVersion);
      } else {
        reportError({
          errorMessage: `Invalid "${range.value}"`,
          errorDetails: `expecting "${range.value}" be "${resolutionDepVersion}" from resolutions`,
          errorTarget: "dependencyValue",
          dependency: range,
          // don't autofix because it's probably a mistake either in resolution or in the other dependency and we can't know which one is the right one
          suggestions: [
            [
              resolutionValue,
              range.value,
              `Fix resolutions's value to "${range.value}"`
            ],
            [
              range,
              resolutionDepVersion,
              `Fix this value to resolutions's value "${resolutionDepVersion}"`
            ]
          ]
        });
      }
    }
  });
}
function checkResolutionsVersionsMatch(reportError, pkg, { tryToAutoFix } = {}) {
  const pkgResolutions = pkg.resolutions || {};
  Object.values(pkgResolutions).forEach((resolutionValue) => {
    checkResolutionVersionMatch(reportError, pkg, resolutionValue, {
      tryToAutoFix
    });
  });
}

function isVersionSatisfiesRange(version, range) {
  const minVersionOfVersion = semver.minVersion(version);
  return !!minVersionOfVersion && semver.satisfies(minVersionOfVersion, range, { includePrerelease: true });
}
function checkSatisfiesVersion(reportError, dependencyValue, range, onlyWarnsForCheck) {
  if (!isVersionSatisfiesRange(dependencyValue.value, range)) {
    const maxSatisfying = semver.maxSatisfying(
      [dependencyValue.value, range],
      range,
      { includePrerelease: true }
    );
    reportError({
      errorMessage: "Invalid",
      errorDetails: `"${dependencyValue.value}" should satisfies "${range}"`,
      dependency: dependencyValue,
      onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(dependencyValue.name),
      ...maxSatisfying && {
        suggestions: [
          [dependencyValue, maxSatisfying, `Use version ${maxSatisfying}`]
        ]
      }
    });
  }
}
function checkMissingSatisfiesVersions(reportError, pkg, acceptedTypes, dependenciesRanges, onlyWarnsForCheck) {
  const types = Array.isArray(acceptedTypes) ? acceptedTypes : [acceptedTypes];
  Object.entries(dependenciesRanges).forEach(([name, range]) => {
    let found = false;
    for (const type of types) {
      const pkgDependency = pkg.value[type]?.[name];
      if (pkgDependency) {
        found = true;
        break;
      }
    }
    if (!found) {
      reportError({
        errorMessage: `Missing "${name}" in "${types.join('" or "')}"`,
        errorDetails: `should satisfies "${range}"`,
        dependency: types.length === 1 ? { name, fieldName: types[0] } : { name },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(name)
      });
    }
  });
}
function checkSatisfiesVersions(reportError, pkg, type, dependenciesRanges, onlyWarnsForCheck) {
  checkMissingSatisfiesVersions(
    reportError,
    pkg,
    type,
    dependenciesRanges,
    onlyWarnsForCheck
  );
  const pkgDependencies = pkg[type] || {};
  Object.entries(dependenciesRanges).forEach(([depKey, range]) => {
    const pkgRange = pkgDependencies[depKey];
    if (pkgRange) {
      checkSatisfiesVersion(reportError, pkgRange, range, onlyWarnsForCheck);
    }
  });
}

function checkSatisfiesVersionsBetweenDependencies(reportError, dep1Pkg, dep1Type, depKeys, dep2Pkg, dep2Type, {
  tryToAutoFix,
  shouldHaveExactVersions,
  onlyWarnsForCheck
}) {
  const dep1Dependencies = dep1Pkg[dep1Type] || {};
  const dep2Dendencies = dep2Pkg[dep2Type] || {};
  depKeys.forEach((depKey) => {
    const dep1Range = dep1Dependencies[depKey];
    if (!dep1Range) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep1Pkg, dep1Type)}`,
        errorDetails: `config expects "${depKey}"`,
        onlyWarns: void 0,
        autoFixable: void 0
      });
      return;
    }
    const dep2Range = dep2Dendencies[depKey];
    if (!dep2Range) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
        errorDetails: `should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
      });
      return;
    }
    const minVersionOfVersion = semver.minVersion(dep2Range);
    if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, dep1Range, {
      includePrerelease: true
    })) {
      reportError({
        errorMessage: `Invalid "${depKey}" ${inDependency(dep2Pkg, dep2Type)}`,
        errorDetails: `"${dep2Range}" should satisfies "${dep1Range}" ${fromDependency(dep1Pkg, dep1Type)}`,
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey)
      });
    }
  });
}

function checkSatisfiesVersionsFromDependency(reportError, pkg, type, depKeys, depPkg, depType, {
  tryToAutoFix,
  shouldHaveExactVersions,
  onlyWarnsForCheck
}) {
  const pkgDependencies = pkg[type] || {};
  const dependencies = depPkg[depType] || {};
  depKeys.forEach((depKey) => {
    const range = dependencies[depKey];
    if (!range) {
      reportError({
        errorMessage: "Unexpected missing dependency",
        errorDetails: `config expects "${depKey}" ${inDependency(depPkg, depType)}`,
        onlyWarns: void 0,
        autoFixable: void 0
      });
      return;
    }
    const pkgRange = pkgDependencies[depKey];
    const getAutoFixIfExists = () => {
      const existingOperator = pkgRange ? getOperator(pkgRange.value) : null;
      const expectedOperator = (() => {
        if (existingOperator !== null) {
          return existingOperator;
        }
        return shouldHaveExactVersions(type) ? "" : null;
      })();
      return expectedOperator === "" ? semver.minVersion(range)?.version : changeOperator(range, expectedOperator);
    };
    if (!pkgRange) {
      const fix = getAutoFixIfExists();
      if (!fix || !tryToAutoFix) {
        reportError({
          errorMessage: "Missing dependency",
          errorDetails: `should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
          dependency: { name: depKey, fieldName: type },
          onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
          autoFixable: !!fix
        });
      } else {
        pkg.change(type, depKey, fix);
      }
    } else {
      const minVersionOfVersion = semver.minVersion(pkgRange.value);
      if (!minVersionOfVersion || !semver.satisfies(minVersionOfVersion, range, {
        includePrerelease: true
      })) {
        const fix = getAutoFixIfExists();
        if (!fix || !tryToAutoFix) {
          reportError({
            errorMessage: "Invalid",
            errorDetails: `"${pkgRange.value}" should satisfies "${range}" ${fromDependency(depPkg, depType)}`,
            dependency: pkgRange,
            onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
            autoFixable: !!fix
          });
        } else {
          pkgRange.changeValue(fix);
        }
      }
    }
  });
}

function checkSatisfiesVersionsInDependency(reportError, depPkg, dependenciesRanges) {
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
          reportError({
            errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
            errorDetails: "it should not be present",
            dependency: { name: dependencyName }
          });
        }
      } else if (!dependencies) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependenciesType}" is missing`,
          dependency: { name: dependencyName }
        });
      } else if (!dependencies[dependencyName]) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencyName}" is missing but should satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName }
        });
      } else if (!semver.satisfies(dependencies[dependencyName], dependencyRange, {
        includePrerelease: true
      }) && !semver.intersects(dependencies[dependencyName], dependencyRange, {
        includePrerelease: true
      })) {
        reportError({
          errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName }
        });
      }
    }
  }
}

if (typeof findPackageJSON !== "function") {
  throw new Error("check-package-dependencies requires node >= 22.14.0");
}
function readPkgJson(packagePath) {
  return JSON.parse(readFileSync(packagePath, "utf8"));
}
function stringifyPkgJson(pkg) {
  return `${JSON.stringify(pkg, null, 2)}
`;
}
function writePkgJson(packagePath, pkg) {
  writeFileSync(packagePath, stringifyPkgJson(pkg));
}
function getLocationFromOffset(packageContent, offset) {
  if (offset < 0 || offset > packageContent.length) {
    throw new Error(
      `Offset ${offset} is out of bounds (0 to ${packageContent.length})`
    );
  }
  const lines = packageContent.slice(0, offset).split("\n");
  const lastLine = lines.at(-1);
  return { line: lines.length, column: lastLine ? lastLine.length + 1 : 1 };
}
function validateJsonParsing(json, errors, packagePath) {
  if (errors.length > 0) {
    throw new Error(
      `Failed to parse JSON at ${packagePath}: ${errors.map(String).join(", ")}`
    );
  }
  if (!json) {
    throw new Error(`Failed to parse JSON at ${packagePath}: empty JSON`);
  }
}
function validatePackageName(nameNode, packagePath) {
  if (!nameNode) {
    throw new Error(`Invalid package.json at ${packagePath}: no "name" field`);
  }
  if (typeof nameNode.value !== "string") {
    throw new TypeError(
      `Invalid package.json at ${packagePath}: "name" field is not a string`
    );
  }
}
const dependencyFieldNames = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "resolutions",
  "resolutionsExplained"
];
function parseDependencyField(json, fieldName, packageContent, packageValue) {
  const fieldNode = findNodeAtLocation(json, [fieldName]);
  if (!fieldNode?.children) {
    return [fieldName, void 0];
  }
  const dependencies = Object.fromEntries(
    fieldNode.children.filter((child) => child.type === "property").map((propertyNode) => {
      const nameNode = propertyNode.children[0];
      const valueNode = propertyNode.children[1];
      const name = getNodeValue(nameNode);
      const value = getNodeValue(valueNode);
      const startLocation = getLocationFromOffset(
        packageContent,
        propertyNode.offset
      );
      const valueStartLocation = getLocationFromOffset(
        packageContent,
        valueNode.offset
      );
      const parsedDependency = {
        fieldName,
        name,
        value,
        locations: {
          all: {
            start: startLocation,
            end: {
              line: startLocation.line,
              column: startLocation.column + propertyNode.length
            }
          },
          name: {
            start: startLocation,
            end: {
              line: startLocation.line,
              column: startLocation.column + nameNode.length
            }
          },
          value: {
            start: valueStartLocation,
            end: {
              line: valueStartLocation.line,
              column: valueStartLocation.column + valueNode.length
            }
          }
        },
        ranges: {
          all: [propertyNode.offset, valueNode.offset + valueNode.length],
          name: [propertyNode.offset, nameNode.offset + nameNode.length],
          value: [valueNode.offset, valueNode.offset + valueNode.length]
        },
        changeValue(newValue) {
          packageValue[fieldName][name] = newValue;
          parsedDependency.value = newValue;
        },
        toString() {
          return `${JSON.stringify(parsedDependency.name)}: ${JSON.stringify(parsedDependency.value)}`;
        }
      };
      return [name, parsedDependency];
    })
  );
  return [fieldName, dependencies];
}
function parsePkg(packageContent, packagePath) {
  const errors = [];
  const json = parseTree(packageContent, errors, { disallowComments: true });
  validateJsonParsing(json, errors, packagePath);
  const nameNode = findNodeAtLocation(json, ["name"]);
  validatePackageName(nameNode, packagePath);
  const value = getNodeValue(json);
  return {
    name: getNodeValue(nameNode),
    path: packagePath,
    value,
    ...Object.fromEntries(
      dependencyFieldNames.map(
        (fieldName) => parseDependencyField(json, fieldName, packageContent, value)
      )
    ),
    change(type, dependencyName, newValue) {
      const dependency = this[type]?.[dependencyName];
      if (dependency) {
        dependency.changeValue(newValue);
      } else {
        value[type] = { ...value[type], [dependencyName]: newValue };
      }
    }
  };
}
function readAndParsePkgJson(packagePath) {
  return parsePkg(readFileSync(packagePath, "utf8"), packagePath);
}
function internalLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname) {
  const packagePath = findPackageJSON(
    pkgDepName,
    `file://${pkgDirname}/package.json`
  );
  if (!packagePath) {
    throw new Error(`Package ${pkgDepName} not found in ${pkgDirname}`);
  }
  return [packagePath, readPkgJson(packagePath)];
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
    let packagePath;
    if (pkgDepName.startsWith(".")) {
      packagePath = `${pkgDirname}/${pkgDepName}/package.json`;
      pkg = internalReadPkgJson(packagePath);
    } else {
      try {
        [packagePath, pkg] = internalCustomLoadPackageJsonFromNodeModules(
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
          if (!matchPackageJson) throw error;
          packagePath = matchPackageJson;
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw error;
        }
      }
    }
    nodeModulesPackagePathCache.set(pkgDepName, [pkg, packagePath]);
    return [pkg, packagePath];
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
              notWarnedFor["*"]?.delete(dependencyName);
              return true;
            }
            if (onlyWarnsFor[dependencyNameLevel1]?.includes(dependencyName)) {
              notWarnedFor[dependencyNameLevel1]?.delete(dependencyName);
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
  isLibrary = false,
  createReportError = createCliReportError
} = {}) {
  const pkgDirname = path.resolve(packageDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${packageDirectoryPath}/package.json`;
  const parsedPkg = readAndParsePkgJson(pkgPath);
  const copyPkg = JSON.parse(
    JSON.stringify(parsedPkg.value)
  );
  const isPkgLibrary = typeof isLibrary === "function" ? isLibrary(parsedPkg.value) : isLibrary;
  const shouldHaveExactVersions = (depType) => !isPkgLibrary ? true : depType === "devDependencies";
  let tryToAutoFix = false;
  if (process.argv.slice(2).includes("--fix")) {
    tryToAutoFix = true;
  }
  const writePackageIfChanged = () => {
    if (!tryToAutoFix) return;
    if (util.isDeepStrictEqual(parsedPkg.value, copyPkg)) return;
    writePkgJson(pkgPath, parsedPkg.value);
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
        throw new Error(`${this.name} failed: ${error.message}`, {
          cause: error
        });
      }
    }
    runSync() {
      const result = this.fn();
      if (result instanceof Promise) {
        throw new TypeError(`${this.name} failed: Promise returned`);
      }
    }
  }
  const jobs = [];
  return {
    async run({ skipDisplayMessages = false } = {}) {
      runCalled = true;
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
    runSync({ skipDisplayMessages = false } = {}) {
      for (const job of jobs) {
        job.runSync();
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
    checkExactVersions({
      onlyWarnsFor,
      internalExactVersionsIgnore,
      allowRangeVersionsInDependencies = true
    } = {}) {
      jobs.push(
        new Job(this.checkExactVersions.name, () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactVersions.onlyWarnsFor",
            onlyWarnsFor
          );
          checkExactVersions(
            createReportError("Exact versions", parsedPkg.path),
            parsedPkg,
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
      const reportError = createReportError(
        "Resolutions match other dependencies",
        parsedPkg.path
      );
      checkResolutionsVersionsMatch(reportError, parsedPkg, {
        tryToAutoFix
      });
      return this;
    },
    checkExactDevVersions({ onlyWarnsFor } = {}) {
      jobs.push(
        new Job(this.checkExactDevVersions.name, () => {
          const onlyWarnsForCheck = createOnlyWarnsForArrayCheck(
            "checkExactDevVersions.onlyWarnsFor",
            onlyWarnsFor
          );
          checkExactVersions(
            createReportError("Exact dev versions", parsedPkg.path),
            parsedPkg,
            ["devDependencies"],
            {
              onlyWarnsForCheck,
              tryToAutoFix,
              getDependencyPackageJson
            }
          );
        })
      );
      return this;
    },
    checkNoDependencies(type = "dependencies", moveToSuggestion = "devDependencies") {
      const reportError = createReportError("No dependencies", parsedPkg.path);
      checkNoDependencies(reportError, parsedPkg, type, moveToSuggestion);
      return this;
    },
    checkDirectPeerDependencies({
      missingOnlyWarnsFor,
      invalidOnlyWarnsFor,
      internalMissingConfigName = "missingOnlyWarnsFor",
      internalInvalidConfigName = "invalidOnlyWarnsFor"
    } = {}) {
      jobs.push(
        new Job(this.checkDirectPeerDependencies.name, () => {
          const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
            internalMissingConfigName,
            missingOnlyWarnsFor
          );
          const invalidOnlyWarnsForCheck = internalInvalidConfigName === internalMissingConfigName ? missingOnlyWarnsForCheck : createOnlyWarnsForMappingCheck(
            internalInvalidConfigName,
            invalidOnlyWarnsFor
          );
          const reportError = createReportError(
            "Peer Dependencies",
            parsedPkg.path
          );
          checkDirectPeerDependencies(
            reportError,
            isPkgLibrary,
            parsedPkg,
            getDependencyPackageJson,
            missingOnlyWarnsForCheck,
            invalidOnlyWarnsForCheck
          );
          reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
          if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
            reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
          }
        })
      );
      return this;
    },
    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = "onlyWarnsFor"
    } = {}) {
      jobs.push(
        new Job(this.checkDirectDuplicateDependencies.name, () => {
          checkDirectDuplicateDependencies(
            createReportError("Direct Duplicate Dependencies", parsedPkg.path),
            parsedPkg,
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
      const reportError = createReportError(
        "Resolutions has explanation",
        parsedPkg.path
      );
      checkResolutionsHasExplanation(
        reportError,
        parsedPkg,
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
        new Job(this.checkIdenticalVersionsThanDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            `Same Versions than ${depPkg.name || ""}`,
            parsedPkg.path
          );
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.dependencies
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.dependencies
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
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
        new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            `Same Versions than ${depPkg.name || ""}`,
            parsedPkg.path
          );
          if (resolutions) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              depPkg.devDependencies
            );
          }
          if (dependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              depPkg.devDependencies
            );
          }
          if (devDependencies) {
            checkIdenticalVersionsThanDependency(
              reportError,
              parsedPkg,
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
      const reportError = createReportError(
        "Satisfies Versions",
        parsedPkg.path
      );
      Object.entries(dependencies).forEach(
        ([dependencyType, dependenciesRanges]) => {
          checkSatisfiesVersions(
            reportError,
            parsedPkg,
            dependencyType,
            dependenciesRanges
          );
        }
      );
      return this;
    },
    checkSatisfiesVersionsFromDependency(depName, { resolutions, dependencies, devDependencies }) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsFromDependency.name, () => {
          const reportError = createReportError(
            "Satisfies Versions From Dependency",
            parsedPkg.path
          );
          const [depPkg] = getDependencyPackageJson(depName);
          if (resolutions) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
              "resolutions",
              resolutions,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions }
            );
          }
          if (dependencies) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
              "dependencies",
              dependencies,
              depPkg,
              "dependencies",
              { tryToAutoFix, shouldHaveExactVersions }
            );
          }
          if (devDependencies) {
            checkSatisfiesVersionsFromDependency(
              reportError,
              parsedPkg,
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
          () => {
            const reportError = createReportError(
              "Satisfies Versions In Dev Dependencies Of Dependency",
              parsedPkg.path
            );
            const [depPkg] = getDependencyPackageJson(depName);
            if (resolutions) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
                "resolutions",
                resolutions,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
            if (dependencies) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
                "dependencies",
                dependencies,
                depPkg,
                "devDependencies",
                { tryToAutoFix, shouldHaveExactVersions }
              );
            }
            if (devDependencies) {
              checkSatisfiesVersionsFromDependency(
                reportError,
                parsedPkg,
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
      const reportError = createReportError(
        "Identical Versions",
        parsedPkg.path
      );
      if (resolutions) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "resolutions",
          resolutions
        );
      }
      if (dependencies) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "dependencies",
          dependencies
        );
      }
      if (devDependencies) {
        checkIdenticalVersions(
          reportError,
          parsedPkg,
          "devDependencies",
          devDependencies
        );
      }
      return this;
    },
    checkSatisfiesVersionsBetweenDependencies(config) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsBetweenDependencies.name, () => {
          const depNamesLvl1 = Object.keys(config);
          const depNamesLvl2 = Object.values(config).flatMap((depConfig) => [
            ...Object.keys(depConfig.dependencies || {}),
            ...Object.keys(depConfig.devDependencies || {})
          ]);
          const uniqueDepNames = [
            .../* @__PURE__ */ new Set([...depNamesLvl1, ...depNamesLvl2])
          ];
          const depPkgsByName = new Map(
            uniqueDepNames.map(
              (depName) => [depName, getDependencyPackageJson(depName)]
            )
          );
          Object.entries(config).forEach(([depName1, depConfig1]) => {
            const [depPkg1, depPkgPath1] = depPkgsByName.get(depName1);
            ["dependencies", "devDependencies"].forEach(
              (dep1Type) => {
                Object.entries(depConfig1[dep1Type] || {}).forEach(
                  ([depName2, depConfig2]) => {
                    if (!depConfig2) return;
                    const [depPkg2] = depPkgsByName.get(depName2);
                    ["dependencies", "devDependencies"].forEach(
                      (dep2Type) => {
                        const reportError = createReportError(
                          "Satisfies Versions From Dependency",
                          depPkgPath1
                        );
                        checkSatisfiesVersionsBetweenDependencies(
                          reportError,
                          depPkg1,
                          dep1Type,
                          depConfig2[dep2Type] || [],
                          depPkg2,
                          dep2Type,
                          { shouldHaveExactVersions }
                        );
                      }
                    );
                  }
                );
              }
            );
          });
        })
      );
      return this;
    },
    checkSatisfiesVersionsInDependency(depName, dependenciesRanges) {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const [depPkg] = getDependencyPackageJson(depName);
          const reportError = createReportError(
            "Satisfies Versions In Dependency",
            parsedPkg.path
          );
          checkSatisfiesVersionsInDependency(
            reportError,
            depPkg,
            dependenciesRanges
          );
        })
      );
      return this;
    },
    checkMinRangeDependenciesSatisfiesDevDependencies() {
      jobs.push(
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const reportError = createReportError(
            '"dependencies" minimum range satisfies "devDependencies"',
            parsedPkg.path
          );
          checkMinRangeSatisfies(
            reportError,
            parsedPkg,
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
        new Job(this.checkSatisfiesVersionsInDependency.name, () => {
          const reportError = createReportError(
            '"peerDependencies" minimum range satisfies "dependencies"',
            parsedPkg.path
          );
          checkMinRangeSatisfies(
            reportError,
            parsedPkg,
            "peerDependencies",
            "dependencies",
            {
              tryToAutoFix
            }
          );
        })
      );
      return this;
    }
  };
}

function checkMonorepoDirectSubpackagePeerDependencies(reportError, isLibrary, monorepoPkg, subpackagePkg, getDependencyPackageJson, invalidOnlyWarnsForCheck, missingOnlyWarnsForCheck) {
  const allDepPkgs = [];
  regularDependencyTypes.forEach((depType) => {
    const dependencies = subpackagePkg[depType];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const [depPkg] = getDependencyPackageJson(depName);
      if (monorepoPkg.devDependencies?.[depName]) {
        continue;
      }
      allDepPkgs.push({ name: depName, type: depType, pkg: depPkg });
    }
  });
  for (const { name: depName, type: depType, pkg: depPkg } of allDepPkgs) {
    if (depPkg.peerDependencies) {
      for (const [peerDepName, range] of Object.entries(
        depPkg.peerDependencies
      )) {
        if (subpackagePkg.devDependencies?.[peerDepName]) {
          continue;
        }
        checkSatisfiesPeerDependency(
          reportError,
          monorepoPkg,
          depType,
          ["devDependencies"],
          peerDepName,
          range,
          depPkg,
          invalidOnlyWarnsForCheck.createFor(depName)
        );
      }
    }
  }
  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);
  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}

function createCheckPackageWithWorkspaces({
  createReportError = createCliReportError,
  ...createCheckPackageOptions
} = {}) {
  const checkPackage = createCheckPackage({
    createReportError,
    ...createCheckPackageOptions,
    isLibrary: false
  });
  const { pkg, pkgDirname } = checkPackage;
  const pkgWorkspaces = pkg.workspaces && !Array.isArray(pkg.workspaces) ? pkg.workspaces.packages : pkg.workspaces;
  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }
  const workspacePackagesPaths = [];
  const match = fs.globSync(pkgWorkspaces, {
    cwd: pkgDirname,
    exclude: ["**/node_modules"]
  });
  for (const pathMatch of match) {
    try {
      fs.accessSync(path.join(pathMatch, "package.json"), constants.R_OK);
    } catch {
      console.log(
        `Ignored potential directory, no package.json found: ${pathMatch}`
      );
      continue;
    }
    const subPkgDirectoryPath = path.relative(process.cwd(), pathMatch);
    workspacePackagesPaths.push(subPkgDirectoryPath);
  }
  const checksWorkspaces = new Map(
    workspacePackagesPaths.map((subPkgDirectoryPath) => {
      const checkPkg = createCheckPackage({
        ...createCheckPackageOptions,
        createReportError,
        packageDirectoryPath: subPkgDirectoryPath,
        internalWorkspacePkgDirectoryPath: createCheckPackageOptions.packageDirectoryPath || "."
      });
      if (!checkPkg.pkg.name) {
        throw new Error(`Package "${subPkgDirectoryPath}" is missing name`);
      }
      return [checkPkg.pkg.name, checkPkg];
    })
  );
  return {
    async run() {
      for (const checksWorkspace of [
        checkPackage,
        ...checksWorkspaces.values()
      ]) {
        await checksWorkspace.run({ skipDisplayMessages: true });
      }
      displayMessages();
    },
    checkRecommended({
      allowRangeVersionsInLibraries = true,
      onlyWarnsForInRootPackage,
      onlyWarnsForInMonorepoPackages,
      onlyWarnsForInRootDependencies,
      onlyWarnsForInMonorepoPackagesDependencies = {},
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor,
      monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor,
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
      const monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
        "monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor",
        monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsFor
      );
      const monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
        "monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor",
        monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsFor
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
        const reportMonorepoDPDError = createReportError(
          `Monorepo Direct Peer Dependencies for dependencies of "${checkSubPackage.pkg.name}" (${checkSubPackage.pkgPathName})`,
          checkPackage.pkgPathName
        );
        checkDuplicateDependencies(
          reportMonorepoDDDError,
          checkSubPackage.parsedPkg,
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
            checkSubPackage.parsedPkg,
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
            checkSubPackage.parsedPkg,
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
            checkSubPackage.parsedPkg,
            checkSubPackage.isPkgLibrary,
            "peerDependencies",
            ["peerDependencies"],
            previousCheckSubPackage.pkg,
            monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(
              checkSubPackage.pkg.name
            )
          );
        });
        checkMonorepoDirectSubpackagePeerDependencies(
          reportMonorepoDPDError,
          checkSubPackage.isPkgLibrary,
          checkPackage.parsedPkg,
          checkSubPackage.parsedPkg,
          checkSubPackage.getDependencyPackageJson,
          monorepoDirectSubpackagePeerDependenciesMissingOnlyWarnsForCheck,
          monorepoDirectSubpackagePeerDependenciesInvalidOnlyWarnsForCheck
        );
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
//# sourceMappingURL=index-node.mjs.map
