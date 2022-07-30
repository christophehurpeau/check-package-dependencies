'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const util = require('util');
const chalk = require('chalk');
const semver = require('semver');
const fs = require('fs');
const glob = require('glob');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const util__default = /*#__PURE__*/_interopDefaultLegacy(util);
const chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
const semver__default = /*#__PURE__*/_interopDefaultLegacy(semver);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);

const getKeys = o => Object.keys(o);
const getEntries = o => Object.entries(o);

/* eslint-disable no-console */
let titleDisplayed = null;
let pkgPathDisplayed = null;
function logMessage(msgTitle, msgInfo, onlyWarns) {
  console.error(`${onlyWarns ? chalk__default.yellow(`⚠ ${msgTitle}`) : chalk__default.red(`❌ ${msgTitle}`)}${msgInfo ? `: ${msgInfo}` : ''}`);
}
function createReportError(title, pkgPathName) {
  return function reportError(msgTitle, msgInfo, onlyWarns) {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk__default.cyan(`== ${title} in ${pkgPathName} ==`));
      titleDisplayed = title;
      pkgPathDisplayed = pkgPathName;
    }

    logMessage(msgTitle, msgInfo, onlyWarns);

    if (!onlyWarns) {
      // console.trace();
      process.exitCode = 1;
    }
  };
}
function reportNotWarnedFor(reportError, onlyWarnsForCheck) {
  const notWarnedFor = onlyWarnsForCheck.getNotWarnedFor();

  if (notWarnedFor.length > 0) {
    reportError(`Invalid config in "${onlyWarnsForCheck.configName}"`, `no warning was raised for ${notWarnedFor.map(depName => `"${depName}"`).join(', ')}`, false);
  }
}
function reportNotWarnedForMapping(reportError, onlyWarnsForMappingCheck) {
  const notWarnedForMapping = onlyWarnsForMappingCheck.getNotWarnedFor();
  getEntries(notWarnedForMapping).forEach(([depNameOrStar, notWarnedFor]) => {
    reportError(`Invalid config in "${onlyWarnsForMappingCheck.configName}" for "${depNameOrStar}"`, `no warning was raised for ${notWarnedFor.map(depName => `"${depName}"`).join(', ')}`);
  });
}

function checkDuplicateDependencies(reportError, pkg, depType, searchIn, depPkg, onlyWarnsForCheck) {
  const dependencies = depPkg[depType];
  if (!dependencies) return;
  const searchInExisting = searchIn.filter(type => pkg[type]);

  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter(type => pkg[type][depKey]);

    if (versionsIn.length > 1) {
      reportError(`${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`);
    } else {
      const versions = versionsIn.map(type => pkg[type][depKey]);
      versions.forEach((version, index) => {
        if (version.startsWith('file:') || range.startsWith('file:')) return; // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace

        if (version.startsWith('workspace:') || range.startsWith('workspace:')) {
          return;
        }

        if (semver__default.satisfies(version, range, {
          includePrerelease: true
        }) || semver__default.intersects(version, range, {
          includePrerelease: true
        })) {
          return;
        } // Ignore reporting duplicate when there's a resolution for it


        if (pkg.resolutions?.[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];
        reportError(`Invalid duplicate dependency "${depKey}"`, `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`, onlyWarnsForCheck.shouldWarnsFor(depKey));
      });
    }
  }
}

function checkDirectDuplicateDependencies(pkg, pkgPathName, depType, getDependencyPackageJson, onlyWarnsForCheck, reportErrorNamePrefix = '') {
  const reportError = createReportError(`${reportErrorNamePrefix}Direct Duplicate Dependencies`, pkgPathName);
  [{
    type: 'devDependencies',
    searchIn: ['devDependencies', 'dependencies']
  }, {
    type: 'dependencies',
    searchIn: ['devDependencies', 'dependencies']
  }].forEach(({
    type,
    searchIn
  }) => {
    if (!pkg[type]) return;
    getKeys(pkg[type]).forEach(depName => {
      const depPkg = getDependencyPackageJson(depName);
      checkDuplicateDependencies(reportError, pkg, depType, searchIn, depPkg, onlyWarnsForCheck.createFor(depName));
    });
  });
  reportNotWarnedForMapping(reportError, onlyWarnsForCheck);
}

function checkPeerDependencies(pkg, reportError, type, allowedPeerIn, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
  const {
    peerDependencies,
    peerDependenciesMeta
  } = depPkg;
  if (!peerDependencies) return;
  const allowedPeerInExisting = allowedPeerIn.filter(allowedPeerInType => pkg[allowedPeerInType]);

  for (const [peerDepName, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(allowedPeerInExistingType => pkg[allowedPeerInExistingType]?.[peerDepName]);

    if (versionsIn.length === 0) {
      const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepName];

      if (peerDependenciesMetaPeerDep?.optional) {
        return;
      }

      reportError(`Missing "${peerDepName}" peer dependency from "${depPkg.name}" in ${type}`, `it should satisfies "${range}" and be in ${allowedPeerIn.join(' or ')}`, missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName));
    } else {
      const versions = versionsIn.map(versionsInType => pkg[versionsInType][peerDepName]);
      versions.forEach((version, index) => {
        if (version.startsWith('npm:')) {
          return;
        }

        const minVersionOfVersion = semver__default.minVersion(version);

        if (!minVersionOfVersion || !semver__default.satisfies(minVersionOfVersion, range, {
          includePrerelease: true
        })) {
          reportError(`Invalid "${peerDepName}" peer dependency`, `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`, invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName));
        }
      });
    }
  }
}

const regularDependencyTypes = ['devDependencies', 'dependencies', 'optionalDependencies'];

const getAllowedPeerInFromType = (depPkgType, isLibrary) => {
  switch (depPkgType) {
    case 'devDependencies':
      return ['devDependencies', 'dependencies'];

    case 'dependencies':
      return isLibrary ? ['dependencies', 'peerDependencies'] : ['devDependencies', 'dependencies'];

    case 'optionalDependencies':
      return isLibrary ? ['dependencies', 'optionalDependencies', 'peerDependencies'] : ['devDependencies', 'dependencies'];
  }
};

function checkDirectPeerDependencies(isLibrary, pkg, pkgPathName, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck) {
  const reportError = createReportError('Peer Dependencies', pkgPathName);
  regularDependencyTypes.forEach(depType => {
    if (!pkg[depType]) return;
    getKeys(pkg[depType]).forEach(depName => {
      const depPkg = getDependencyPackageJson(depName);

      if (depPkg.peerDependencies) {
        checkPeerDependencies(pkg, reportError, depType, getAllowedPeerInFromType(depType, isLibrary), depPkg, missingOnlyWarnsForCheck.createFor(depName), invalidOnlyWarnsForCheck.createFor(depName));
      }
    });
  });
  reportNotWarnedForMapping(reportError, missingOnlyWarnsForCheck);

  if (missingOnlyWarnsForCheck !== invalidOnlyWarnsForCheck) {
    reportNotWarnedForMapping(reportError, invalidOnlyWarnsForCheck);
  }
}

/* eslint-disable complexity */

const isVersionRange = version => version.startsWith('^') || version.startsWith('~');

function checkExactVersions(pkg, pkgPathName, types, {
  getDependencyPackageJson,
  onlyWarnsForCheck,
  internalExactVersionsIgnore,
  tryToAutoFix = false
}) {
  const reportError = createReportError('Exact versions', pkgPathName);
  types.forEach(type => {
    const pkgDependencies = pkg[type];
    if (!pkgDependencies) return;

    for (const [dependencyName, versionConst] of Object.entries(pkgDependencies)) {
      let version = versionConst;

      if (version.startsWith('npm:')) {
        const match = /^npm:.*@(.*)$/.exec(version);
        if (!match) throw new Error(`Invalid version match: ${version}`);
        const [, realVersion] = match;
        version = realVersion;
      }

      if (isVersionRange(version)) {
        if (internalExactVersionsIgnore?.includes(dependencyName)) {
          return;
        }

        const shouldOnlyWarn = onlyWarnsForCheck.shouldWarnsFor(dependencyName);

        if (!shouldOnlyWarn && tryToAutoFix && getDependencyPackageJson) {
          let resolvedDep;

          try {
            resolvedDep = getDependencyPackageJson(dependencyName);
          } catch {
            resolvedDep = null;
          }

          if (!resolvedDep || !resolvedDep.version) {
            reportError(`Unexpected range dependency in "${type}" for "${dependencyName}"`, `expecting "${version}" to be exact, autofix failed to resolve "${dependencyName}".`, shouldOnlyWarn);
          } else if (!semver__default.satisfies(resolvedDep.version, version, {
            includePrerelease: true
          })) {
            reportError(`Unexpected range dependency in "${type}" for "${dependencyName}"`, `expecting "${version}" to be exact, autofix failed as "${dependencyName}"'s resolved version is "${resolvedDep.version}" and doesn't satisfies "${version}".`, shouldOnlyWarn);
          } else {
            pkgDependencies[dependencyName] = resolvedDep.version;
          }
        } else {
          reportError(`Unexpected range dependency in "${type}" for "${dependencyName}"`, `expecting "${version}" to be exact "${version.slice(1)}".`, shouldOnlyWarn);
        }
      }
    }
  });
  reportNotWarnedFor(reportError, onlyWarnsForCheck);
}

function checkIdenticalVersions(pkg, pkgPathName, type, deps, onlyWarnsForCheck) {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError('Identical Versions', pkgPathName);
  getKeys(deps).forEach(depKey => {
    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(`Unexpected missing ${type} for "${depKey}".`);
      return;
    }

    const depConfigArrayOrObject = deps[depKey];
    const depConfig = Array.isArray(depConfigArrayOrObject) ? {
      [type]: depConfigArrayOrObject
    } : depConfigArrayOrObject;
    getKeys(depConfig).forEach(depKeyType => {
      const pkgDependenciesType = pkg[depKeyType] || {};
      depConfig[depKeyType]?.forEach(depKeyIdentical => {
        const value = pkgDependenciesType[depKeyIdentical];

        if (!value) {
          reportError(`Missing "${depKeyIdentical}" in ${depKeyType}`, `it should be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
        }

        if (value !== version) {
          reportError(`Invalid "${depKeyIdentical}" in ${depKeyType}`, `expecting "${value}" be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
        }
      });
    });
  });
}

function checkIdenticalVersionsThanDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck) {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError(`Same Versions than ${depPkg.name}`, pkgPathName);
  depKeys.forEach(depKey => {
    const version = dependencies[depKey];

    if (!version) {
      reportError(`Unexpected missing dependency "${depKey}" in "${depPkg.name}".`);
      return;
    }

    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(`Unexpected range dependency in "${depPkg.name}" for "${depKey}"`, 'perhaps use checkSatisfiesVersionsFromDependency() instead.');
      return;
    }

    const value = pkgDependencies[depKey];

    if (!value) {
      reportError(`Missing "${depKey}" in ${type}`, `expecting to be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
    }

    if (value !== version) {
      reportError(`Invalid "${depKey}" in ${type}`, `expecting "${value}" to be "${version}".`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
    }
  });
}

function checkNoDependencies(pkg, pkgPath, type = 'dependencies', moveToSuggestion = 'devDependencies') {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;
  const reportError = createReportError('No dependencies', pkgPath);
  reportError(`Unexpected ${type}`, `you should move them in ${moveToSuggestion}`);
}

function checkResolutionsHasExplanation(pkg, pkgPathName, checkMessage, getDependencyPackageJson) {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  const reportError = createReportError('Resolutions has explanation', pkgPathName);
  Object.keys(pkgResolutions).forEach(depKey => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError(`Missing "${depKey}" in resolutionsExplained.`);
    }
  });
  Object.keys(pkgResolutionsExplained).forEach(depKey => {
    if (!pkgResolutions[depKey]) {
      reportError(`Found "${depKey}" in resolutionsExplained but not in resolutions.`);
    } else {
      const error = checkMessage(depKey, pkgResolutionsExplained[depKey], {
        getDependencyPackageJson
      });

      if (error) {
        reportError(`Invalid message for "${depKey}" in resolutionsExplained`, `${error}.`);
      }
    }
  });
}

function checkResolutionsVersionsMatch(pkg, pkgPathName, {
  tryToAutoFix
} = {}) {
  const pkgResolutions = pkg.resolutions || {};
  const reportError = createReportError('Resolutions match other dependencies', pkgPathName);
  Object.entries(pkgResolutions).forEach(([depName, resolutionDepVersion]) => {
    ['dependencies', 'devDependencies'].forEach(depType => {
      const range = pkg?.[depType]?.[depName];
      if (!range) return;

      if (!semver__default.satisfies(resolutionDepVersion, range, {
        includePrerelease: true
      })) {
        if (tryToAutoFix) {
          pkg[depType][depName] = resolutionDepVersion;
        } else {
          reportError(`Invalid "${depName}" in ${depType}`, `expecting "${range}" be "${resolutionDepVersion}" from resolutions.`);
        }
      }
    });
  });
}

function checkSatisfiesVersionsFromDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsForCheck) {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError(`Satisfies Versions from ${depPkg.name}`, pkgPathName);
  depKeys.forEach(depKey => {
    const range = dependencies[depKey];

    if (!range) {
      reportError(`Unexpected missing dependency "${depKey}" in "${depPkg.name}".`);
      return;
    }

    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(`Missing "${depKey}" in ${type}`, `should satisfies "${range}" from "${depPkg.name}" ${depKey}.`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
    } else {
      const minVersionOfVersion = semver__default.minVersion(version);

      if (!minVersionOfVersion || !semver__default.satisfies(minVersionOfVersion, range, {
        includePrerelease: true
      })) {
        reportError(`Invalid "${depKey}" in ${type}`, `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`, onlyWarnsForCheck?.shouldWarnsFor(depKey));
      }
    }
  });
}

function readPkgJson(packagePath) {
  return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
}
function writePkgJson(packagePath, pkg) {
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}
/** @internal */

function internalLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname) {
  // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires
  return require(require.resolve(`${pkgDepName}/package.json`, {
    paths: [pkgDirname]
  }));
}
function createGetDependencyPackageJson({
  pkgDirname,
  nodeModulesPackagePathCache = new Map(),
  internalCustomLoadPackageJsonFromNodeModules = internalLoadPackageJsonFromNodeModules,
  internalReadPkgJson = readPkgJson
}) {
  return pkgDepName => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg;

    if (pkgDepName.startsWith('.')) {
      pkg = internalReadPkgJson(`${pkgDirname}/${pkgDepName}/package.json`);
    } else {
      try {
        pkg = internalCustomLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname);
      } catch (err) {
        if (!(err instanceof Error)) throw err;

        if (err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
          throw err;
        }

        const match = / in (.*[/\\]package.json)($|\simported from)/.exec(err.message);

        if (match) {
          const [, matchPackageJson] = match;
          pkg = internalReadPkgJson(matchPackageJson);
        } else {
          throw err;
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

const isMapping = onlyWarnsFor => {
  return typeof onlyWarnsFor === 'object' && !Array.isArray(onlyWarnsFor);
};

const createOnlyWarnsForMappingCheck = (configName, onlyWarnsFor) => {
  if (isMapping(onlyWarnsFor)) {
    const notWarnedFor = Object.fromEntries(getEntries(onlyWarnsFor).map(([entryKey, entryValue]) => [entryKey, new Set(entryValue)]));
    return {
      configName,
      getNotWarnedFor: () => Object.fromEntries(getEntries(notWarnedFor).filter(([key, set]) => set.size > 0).map(([key, set]) => [key, [...set]])),

      createFor(dependencyNameLevel1) {
        return {
          configName,

          getNotWarnedFor() {
            throw new Error('Invalid call to getNotWarnedFor()');
          },

          shouldWarnsFor(dependencyName) {
            if (onlyWarnsFor['*']?.includes(dependencyName)) {
              notWarnedFor['*'].delete(dependencyName);
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

  const arrayOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(configName, onlyWarnsFor);
  return {
    configName,
    getNotWarnedFor: () => {
      const notWarnedFor = arrayOnlyWarnsForCheck.getNotWarnedFor();

      if (notWarnedFor.length > 0) {
        return {
          '*': notWarnedFor
        };
      }

      return {};
    },

    createFor() {
      return {
        configName,

        getNotWarnedFor() {
          throw new Error('Invalid call to getNotWarnedFor()');
        },

        shouldWarnsFor(dependencyName) {
          return arrayOnlyWarnsForCheck.shouldWarnsFor(dependencyName);
        }

      };
    }

  };
};

/* eslint-disable complexity */
function createCheckPackage(pkgDirectoryPath = '.', {
  tryToAutoFix = false,
  internalWorkspacePkgDirectoryPath
} = {}) {
  const pkgDirname = path__default.resolve(pkgDirectoryPath);
  const pkgPath = `${pkgDirname}/package.json`;
  const pkgPathName = `${pkgDirectoryPath}/package.json`;
  const pkg = readPkgJson(pkgPath);
  const copyPkg = JSON.parse(JSON.stringify(pkg));

  if (process.env.CI && process.env.CHECK_PACKAGE_DEPENDENCIES_ENABLE_CI_AUTOFIX !== 'true') {
    tryToAutoFix = false;
  }

  if (process.argv.slice(2).includes('--fix')) {
    tryToAutoFix = true;
  }

  const writePackageIfChanged = () => {
    if (!tryToAutoFix) return;
    if (util__default.isDeepStrictEqual(pkg, copyPkg)) return;
    writePkgJson(pkgPath, pkg);
  };

  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname
  });
  let runCalled = false;

  if (!internalWorkspacePkgDirectoryPath) {
    process.on('beforeExit', () => {
      if (!runCalled) {
        console.warn('\nFor future compatibility, call .run() and await the result.');
      }
    });
  }

  return {
    run() {
      runCalled = true;
      return Promise.resolve();
    },

    pkg,
    pkgDirname,
    pkgPathName,
    getDependencyPackageJson,

    checkExactVersions({
      onlyWarnsFor,
      internalExactVersionsIgnore,
      allowRangeVersionsInDependencies = true
    } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck('checkExactVersions.onlyWarnsFor', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, !allowRangeVersionsInDependencies ? ['dependencies', 'devDependencies', 'resolutions'] : ['devDependencies', 'resolutions'], {
        onlyWarnsForCheck,
        internalExactVersionsIgnore,
        getDependencyPackageJson,
        tryToAutoFix
      });
      writePackageIfChanged();
      return this;
    },

    checkResolutionsVersionsMatch() {
      checkResolutionsVersionsMatch(pkg, pkgPathName, {
        tryToAutoFix
      });
      writePackageIfChanged();
      return this;
    },

    /** @deprecated use checkExactVersions({ allowRangeVersionsInDependencies: true })  */
    checkExactVersionsForLibrary({
      onlyWarnsFor
    } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck('checkExactVersionsForLibrary.onlyWarnsFor', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, ['devDependencies', 'resolutions'], {
        onlyWarnsForCheck,
        tryToAutoFix,
        getDependencyPackageJson
      });
      writePackageIfChanged();
      return this;
    },

    checkExactDevVersions({
      onlyWarnsFor
    } = {}) {
      const onlyWarnsForCheck = createOnlyWarnsForArrayCheck('checkExactDevVersions.onlyWarnsFor', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, ['devDependencies'], {
        onlyWarnsForCheck,
        tryToAutoFix,
        getDependencyPackageJson
      });
      writePackageIfChanged();
      return this;
    },

    checkNoDependencies(type = 'dependencies', moveToSuggestion = 'devDependencies') {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({
      isLibrary = false,
      onlyWarnsFor: deprecatedOnlyWarnsFor,
      missingOnlyWarnsFor = deprecatedOnlyWarnsFor,
      invalidOnlyWarnsFor = deprecatedOnlyWarnsFor,
      internalMissingConfigName = deprecatedOnlyWarnsFor ? 'onlyWarnsFor' : 'missingOnlyWarnsFor',
      internalInvalidConfigName = deprecatedOnlyWarnsFor ? 'onlyWarnsFor' : 'invalidOnlyWarnsFor'
    } = {}) {
      const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(internalMissingConfigName, missingOnlyWarnsFor);
      const invalidOnlyWarnsForCheck = internalInvalidConfigName === internalMissingConfigName ? missingOnlyWarnsForCheck : createOnlyWarnsForMappingCheck(internalInvalidConfigName, invalidOnlyWarnsFor);
      checkDirectPeerDependencies(isLibrary, pkg, pkgPathName, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck);
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalConfigName = 'onlyWarnsFor'
    } = {}) {
      checkDirectDuplicateDependencies(pkg, pkgPathName, 'dependencies', getDependencyPackageJson, createOnlyWarnsForMappingCheck(internalConfigName, onlyWarnsFor));
      return this;
    },

    checkResolutionsHasExplanation(checkMessage = () => undefined) {
      checkResolutionsHasExplanation(pkg, pkgPathName, checkMessage, getDependencyPackageJson);
      return this;
    },

    checkRecommended({
      isLibrary = false,
      onlyWarnsForInPackage,
      onlyWarnsForInDependencies,
      allowRangeVersionsInDependencies = isLibrary,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      exactVersionsOnlyWarnsFor,
      internalExactVersionsIgnore,
      checkResolutionMessage
    } = {}) {
      let internalMissingPeerDependenciesOnlyWarnsFor = peerDependenciesOnlyWarnsFor;
      let internalInvalidPeerDependenciesOnlyWarnsFor = peerDependenciesOnlyWarnsFor;
      let internalDirectDuplicateDependenciesOnlyWarnsFor = directDuplicateDependenciesOnlyWarnsFor;

      if (onlyWarnsForInPackage) {
        if (exactVersionsOnlyWarnsFor) {
          console.warn('Ignoring "exactVersionsOnlyWarnsFor" as "onlyWarnsForInPackage" is used.');
        }

        exactVersionsOnlyWarnsFor = onlyWarnsForInPackage.exactVersions || [];
      }

      if (onlyWarnsForInDependencies) {
        if (peerDependenciesOnlyWarnsFor) {
          console.warn('Ignoring "peerDependenciesOnlyWarnsFor" as "onlyWarnsFor" is used.');
        }

        if (directDuplicateDependenciesOnlyWarnsFor) {
          console.warn('Ignoring "directDuplicateDependenciesOnlyWarnsFor" as "onlyWarnsFor" is used.');
        }

        internalDirectDuplicateDependenciesOnlyWarnsFor = {};
        internalMissingPeerDependenciesOnlyWarnsFor = {};
        internalInvalidPeerDependenciesOnlyWarnsFor = {};
        getEntries(onlyWarnsForInDependencies).forEach(([dependencyNameOrSpecialKey, onlyWarnsForValue]) => {
          if (onlyWarnsForValue.duplicateDirectDependency) {
            internalDirectDuplicateDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.duplicateDirectDependency;
          }

          if (onlyWarnsForValue.missingPeerDependency) {
            internalMissingPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.missingPeerDependency;
          }

          if (onlyWarnsForValue.invalidPeerDependencyVersion) {
            internalInvalidPeerDependenciesOnlyWarnsFor[dependencyNameOrSpecialKey] = onlyWarnsForValue.invalidPeerDependencyVersion;
          }
        });
      }

      this.checkExactVersions({
        allowRangeVersionsInDependencies,
        onlyWarnsFor: exactVersionsOnlyWarnsFor,
        internalExactVersionsIgnore
      });
      this.checkResolutionsVersionsMatch();
      this.checkResolutionsHasExplanation(checkResolutionMessage);
      this.checkDirectPeerDependencies({
        isLibrary,
        missingOnlyWarnsFor: internalMissingPeerDependenciesOnlyWarnsFor,
        invalidOnlyWarnsFor: internalInvalidPeerDependenciesOnlyWarnsFor,
        internalMissingConfigName: peerDependenciesOnlyWarnsFor ? 'peerDependenciesOnlyWarnsFor' : 'onlyWarnsForInDependencies.missingPeerDependency',
        internalInvalidConfigName: peerDependenciesOnlyWarnsFor ? 'peerDependenciesOnlyWarnsFor' : 'onlyWarnsForInDependencies.invalidPeerDependencyVersion'
      });
      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: internalDirectDuplicateDependenciesOnlyWarnsFor,
        internalConfigName: directDuplicateDependenciesOnlyWarnsFor ? 'directDuplicateDependenciesOnlyWarnsFor' : 'onlyWarnsForInDependencies.duplicateDirectDependency'
      });
      return this;
    },

    checkIdenticalVersionsThanDependency(depName, {
      resolutions,
      dependencies,
      devDependencies
    }) {
      const depPkg = getDependencyPackageJson(depName);

      if (resolutions) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'resolutions', resolutions, depPkg, depPkg.dependencies);
      }

      if (dependencies) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'dependencies', dependencies, depPkg, depPkg.dependencies);
      }

      if (devDependencies) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'devDependencies', devDependencies, depPkg, depPkg.dependencies);
      }

      return this;
    },

    checkIdenticalVersionsThanDevDependencyOfDependency(depName, {
      resolutions,
      dependencies,
      devDependencies
    }) {
      const depPkg = getDependencyPackageJson(depName);

      if (resolutions) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'resolutions', resolutions, depPkg, depPkg.devDependencies);
      }

      if (dependencies) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'dependencies', dependencies, depPkg, depPkg.devDependencies);
      }

      if (devDependencies) {
        checkIdenticalVersionsThanDependency(pkg, pkgPathName, 'devDependencies', devDependencies, depPkg, depPkg.devDependencies);
      }

      return this;
    },

    checkSatisfiesVersionsFromDependency(depName, {
      resolutions,
      dependencies,
      devDependencies
    }) {
      const depPkg = getDependencyPackageJson(depName);

      if (resolutions) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'resolutions', resolutions, depPkg, depPkg.dependencies);
      }

      if (dependencies) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'dependencies', dependencies, depPkg, depPkg.dependencies);
      }

      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'devDependencies', devDependencies, depPkg, depPkg.dependencies);
      }

      return this;
    },

    checkSatisfiesVersionsInDevDependenciesOfDependency(depName, {
      resolutions,
      dependencies,
      devDependencies
    }) {
      const depPkg = getDependencyPackageJson(depName);

      if (resolutions) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'resolutions', resolutions, depPkg, depPkg.devDependencies);
      }

      if (dependencies) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'dependencies', dependencies, depPkg, depPkg.devDependencies);
      }

      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(pkg, pkgPathName, 'devDependencies', devDependencies, depPkg, depPkg.devDependencies);
      }

      return this;
    },

    checkIdenticalVersions({
      resolutions,
      dependencies,
      devDependencies
    }) {
      if (resolutions) {
        checkIdenticalVersions(pkg, pkgPathName, 'resolutions', resolutions);
      }

      if (dependencies) {
        checkIdenticalVersions(pkg, pkgPathName, 'dependencies', dependencies);
      }

      if (devDependencies) {
        checkIdenticalVersions(pkg, pkgPathName, 'devDependencies', devDependencies);
      }

      return this;
    },

    checkSatisfiesVersionsBetweenDependencies(depName1, depName2, {
      dependencies,
      devDependencies
    }) {
      const depPkg1 = getDependencyPackageJson(depName1);
      const depPkg2 = getDependencyPackageJson(depName2);

      if (dependencies) {
        checkSatisfiesVersionsFromDependency(depPkg2, pkgPathName, 'dependencies', dependencies, depPkg1, depPkg1.dependencies);
      }

      if (devDependencies) {
        checkSatisfiesVersionsFromDependency(depPkg2, pkgPathName, 'devDependencies', devDependencies, depPkg1, depPkg1.dependencies);
      }

      return this;
    }

  };
}

/* eslint-disable max-lines */
function createCheckPackageWithWorkspaces(pkgDirectoryPath = '.', createCheckPackageOptions = {}) {
  const checkPackage = createCheckPackage(pkgDirectoryPath, createCheckPackageOptions);
  const {
    pkg,
    pkgDirname
  } = checkPackage;
  const pkgWorkspaces = pkg.workspaces && !Array.isArray(pkg.workspaces) ? pkg.workspaces.packages : pkg.workspaces;

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspacePackagesPaths = [];

  if (pkgWorkspaces) {
    pkgWorkspaces.forEach(pattern => {
      const match = glob__default.sync(pattern, {
        cwd: pkgDirname
      });
      match.forEach(pathMatch => {
        const stat = fs__default.statSync(pathMatch);
        if (!stat.isDirectory()) return;
        const subPkgDirectoryPath = path__default.relative(process.cwd(), pathMatch);
        workspacePackagesPaths.push(subPkgDirectoryPath);
      });
    });
  }

  const checksWorkspaces = new Map(workspacePackagesPaths.map(subPkgDirectoryPath => {
    const checkPkg = createCheckPackage(subPkgDirectoryPath, { ...createCheckPackageOptions,
      internalWorkspacePkgDirectoryPath: pkgDirectoryPath
    });
    return [checkPkg.pkg.name, checkPkg];
  }));
  let runCalled = false;
  process.on('beforeExit', () => {
    if (!runCalled) {
      console.warn('\nFor future compatibility, call .run()');
    }
  });
  return {
    async run() {
      runCalled = true;
      await Promise.all([...checksWorkspaces.values()].map(checksWorkspace => checksWorkspace.run()));
    },

    checkRecommended({
      isLibrary = () => false,
      allowRangeVersionsInLibraries = true,
      onlyWarnsForInRootPackage,
      onlyWarnsForInMonorepoPackages,
      onlyWarnsForInDependencies,
      onlyWarnsForInRootDependencies = onlyWarnsForInDependencies,
      onlyWarnsForInMonorepoPackagesDependencies = onlyWarnsForInDependencies ? {
        '*': onlyWarnsForInDependencies
      } : {},
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      monorepoDirectDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage
    } = {}) {
      if (peerDependenciesOnlyWarnsFor) {
        console.warn('Option "peerDependenciesOnlyWarnsFor" in checkRecommended() is deprecated. Use "onlyWarnsForInDependencies" instead.');
      }

      if (directDuplicateDependenciesOnlyWarnsFor) {
        console.warn('Option "directDuplicateDependenciesOnlyWarnsFor" in checkRecommended() is deprecated. Use "onlyWarnsForInDependencies" instead.');
      }

      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        onlyWarnsForInPackage: onlyWarnsForInRootPackage,
        onlyWarnsForInDependencies: onlyWarnsForInRootDependencies,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage
      });
      const monorepoDirectDuplicateDependenciesOnlyWarnsForCheck = createOnlyWarnsForMappingCheck('monorepoDirectDuplicateDependenciesOnlyWarnsFor', monorepoDirectDuplicateDependenciesOnlyWarnsFor);
      const previousCheckedWorkspaces = new Map();
      checksWorkspaces.forEach((checkSubPackage, id) => {
        const isPackageALibrary = isLibrary(id);
        checkSubPackage.checkRecommended({
          isLibrary: isPackageALibrary,
          allowRangeVersionsInDependencies: isPackageALibrary ? allowRangeVersionsInLibraries : false,
          onlyWarnsForInPackage: onlyWarnsForInMonorepoPackages ? { ...onlyWarnsForInMonorepoPackages['*'],
            ...onlyWarnsForInMonorepoPackages[checkSubPackage.pkg.name]
          } : undefined,
          onlyWarnsForInDependencies: onlyWarnsForInMonorepoPackagesDependencies[checkSubPackage.pkg.name],
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          internalExactVersionsIgnore: [...checksWorkspaces.keys()],
          checkResolutionMessage
        });
        const reportMonorepoDDDError = createReportError('Monorepo Direct Duplicate Dependencies', checkSubPackage.pkgPathName); // Root

        checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.pkg, 'devDependencies', ['dependencies', 'devDependencies'], pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name)); // previous packages

        previousCheckedWorkspaces.forEach(previousCheckSubPackage => {
          checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.pkg, 'devDependencies', ['dependencies', 'devDependencies'], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
          checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.pkg, 'dependencies', ['dependencies', 'devDependencies'], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
          checkDuplicateDependencies(reportMonorepoDDDError, checkSubPackage.pkg, 'peerDependencies', ['peerDependencies'], previousCheckSubPackage.pkg, monorepoDirectDuplicateDependenciesOnlyWarnsForCheck.createFor(checkSubPackage.pkg.name));
        });
        previousCheckedWorkspaces.set(id, checkSubPackage);
      });
      reportNotWarnedForMapping(createReportError('Monorepo Direct Duplicate Dependencies', checkPackage.pkgPathName), monorepoDirectDuplicateDependenciesOnlyWarnsForCheck);
      return this;
    },

    forRoot(callback) {
      callback(checkPackage);
      return this;
    },

    forEach(callback) {
      checksWorkspaces.forEach(checkSubPackage => {
        callback(checkSubPackage);
      });
      return this;
    },

    for(id, callback) {
      const packageCheck = checksWorkspaces.get(id);

      if (!packageCheck) {
        throw new Error(`Invalid package name: ${id}. Known package names: "${[...checksWorkspaces.keys()].join('","')}"`);
      }

      callback(packageCheck);
      return this;
    }

  };
}

exports.createCheckPackage = createCheckPackage;
exports.createCheckPackageWithWorkspaces = createCheckPackageWithWorkspaces;
//# sourceMappingURL=index-node14.cjs.js.map
