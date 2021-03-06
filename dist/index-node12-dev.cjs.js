'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const path = require('path');
const semver = require('semver');
const chalk = require('chalk');
const fs = require('fs');
const glob = require('glob');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const path__default = /*#__PURE__*/_interopDefaultLegacy(path);
const semver__default = /*#__PURE__*/_interopDefaultLegacy(semver);
const chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const glob__default = /*#__PURE__*/_interopDefaultLegacy(glob);

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

function checkWarnedFor(reportError, onlyWarnsFor = [], warnedFor) {
  onlyWarnsFor.forEach(depName => {
    if (!warnedFor.has(depName)) {
      reportError(`Invalid "${depName}" in "onlyWarnsFor" but no warning was raised`);
    }
  });
}
function checkDirectDuplicateDependencies(pkg, pkgPathName, depType, searchIn, depPkg, onlyWarnsFor = [], warnedForInternal) {
  const dependencies = depPkg[depType];
  if (!dependencies) return;
  const warnedFor = warnedForInternal || new Set();
  const reportError = createReportError('Direct Duplicate Dependencies', pkgPathName);
  const searchInExisting = searchIn.filter(type => pkg[type]);

  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter(type => pkg[type][depKey]);

    if (versionsIn.length > 1) {
      reportError(`${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`);
    } else {
      const versions = versionsIn.map(type => pkg[type][depKey]);
      versions.forEach((version, index) => {
        var _pkg$resolutions;

        if (version.startsWith('file:') || range.startsWith('file:')) return; // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace

        if (version.startsWith('workspace:') || range.startsWith('workspace:')) {
          return;
        }

        if (semver__default.intersects(version, range)) {
          return;
        } // Ignore reporting duplicate when there's a resolution for it


        if ((_pkg$resolutions = pkg.resolutions) !== null && _pkg$resolutions !== void 0 && _pkg$resolutions[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];
        const shouldWarns = onlyWarnsFor.includes(depKey);
        if (shouldWarns) warnedFor.add(depKey);
        reportError(`Invalid duplicate dependency "${depKey}"`, `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`, shouldWarns);
      });
    }
  }

  if (!warnedForInternal) {
    checkWarnedFor(reportError, onlyWarnsFor, warnedFor);
  }
}

function checkPeerDependencies(pkg, pkgPathName, type, allowedPeerIn, depPkg, onlyWarnsFor = []) {
  const {
    peerDependencies,
    peerDependenciesMeta
  } = depPkg;
  if (!peerDependencies) return;
  const reportError = createReportError('Peer Dependencies', pkgPathName);
  const allowedPeerInExisting = allowedPeerIn.filter(type => pkg[type]);

  for (const [peerDepKey, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(type => pkg[type][peerDepKey]);

    if (versionsIn.length === 0) {
      const peerDependenciesMetaPeerDep = peerDependenciesMeta === null || peerDependenciesMeta === void 0 ? void 0 : peerDependenciesMeta[peerDepKey];

      if (peerDependenciesMetaPeerDep !== null && peerDependenciesMetaPeerDep !== void 0 && peerDependenciesMetaPeerDep.optional) {
        return;
      }

      reportError(`Missing "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}`, `it should satisfies "${range}" and be in ${allowedPeerIn.join(' or ')}`, onlyWarnsFor.includes(peerDepKey));
    } else {
      const versions = versionsIn.map(type => pkg[type][peerDepKey]);
      versions.forEach((version, index) => {
        const minVersionOfVersion = semver__default.minVersion(version);

        if (!minVersionOfVersion || !semver__default.satisfies(minVersionOfVersion, range)) {
          reportError(`Invalid "${peerDepKey}" peer dependency`, `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`, onlyWarnsFor.includes(peerDepKey));
        }
      });
    }
  }
}

const getAllowedPeerInFromType = (depPkgType, isLibrary) => {
  switch (depPkgType) {
    case 'devDependencies':
      return ['devDependencies', 'dependencies'];

    case 'dependencies':
    case 'optionalDependencies':
      return isLibrary ? ['dependencies', 'peerDependencies'] : ['dependencies'];
  }
};

function checkDirectPeerDependencies(isLibrary, pkg, pkgPathName, depPkgType, depPkg, onlyWarnsFor = []) {
  if (depPkg.peerDependencies) {
    checkPeerDependencies(pkg, pkgPathName, depPkgType, getAllowedPeerInFromType(depPkgType, isLibrary), depPkg, onlyWarnsFor);
  } // TODO optionalPeerDependency

}

function checkExactVersions(pkg, pkgPathName, type, onlyWarnsFor = []) {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;
  const reportError = createReportError('Exact versions', pkgPathName);

  for (const [depKey, version] of Object.entries(pkgDependencies)) {
    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(`Unexpected range dependency in "${type}" for "${depKey}"`, `expecting "${version}" to be exact "${version.slice(1)}".`, onlyWarnsFor.includes(depKey));
    }
  }
}

const getKeys = o => Object.keys(o);

function checkIdenticalVersions(pkg, pkgPathName, type, deps, onlyWarnsFor = []) {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError('Identical Versions', pkgPathName);
  getKeys(deps).forEach(depKey => {
    const version = pkgDependencies[depKey];

    if (!version) {
      reportError(`Unexpected missing ${type} for "${depKey}".`);
      return;
    }

    deps[depKey].forEach(depKeyIdentical => {
      const value = pkgDependencies[depKeyIdentical];

      if (!value) {
        reportError(`Missing "${depKeyIdentical}" in ${type}`, `it should be "${version}".`, onlyWarnsFor.includes(depKey));
      }

      if (value !== version) {
        reportError(`Invalid "${depKeyIdentical}" in ${type}`, `expecting "${value}" be "${version}".`, onlyWarnsFor.includes(depKey));
      }
    });
  });
}

function checkIdenticalVersionsThanDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsFor = []) {
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
      reportError(`Missing "${depKey}" in ${type}`, `expecting to be "${version}".`, onlyWarnsFor.includes(depKey));
    }

    if (value !== version) {
      reportError(`Invalid "${depKey}" in ${type}`, `expecting "${value}" to be "${version}".`, onlyWarnsFor.includes(depKey));
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

function checkSatisfiesVersionsFromDependency(pkg, pkgPathName, type, depKeys, depPkg, dependencies = {}, onlyWarnsFor = []) {
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
      reportError(`Missing "${depKey}" in ${type}`, `should satisfies "${range}" from "${depPkg.name}" ${depKey}.`, onlyWarnsFor.includes(depKey));
    } else {
      const minVersionOfVersion = semver__default.minVersion(version);

      if (!minVersionOfVersion || !semver__default.satisfies(minVersionOfVersion, range)) {
        reportError(`Invalid "${depKey}" in ${type}`, `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`, onlyWarnsFor.includes(depKey));
      }
    }
  });
}

function readPkgJson(packagePath) {
  return JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
}
function createGetDependencyPackageJson({
  pkgDirname,
  nodeModulesPackagePathCache = new Map()
}) {
  return pkgDepName => {
    const existing = nodeModulesPackagePathCache.get(pkgDepName);
    if (existing) return existing;
    let pkg;

    if (pkgDepName.startsWith('.')) {
      pkg = readPkgJson(`${pkgDirname}/${pkgDepName}/package.json`);
    } else {
      try {
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-unsafe-assignment
        pkg = require(require.resolve(`${pkgDepName}/package.json`, {
          paths: [pkgDirname]
        }));
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (err.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
          throw err;
        }

        const match = / in (.*\/package.json)($|\simported from)/.exec( // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        err.message);

        if (match) {
          const [, matchPackageJson] = match;
          pkg = readPkgJson(matchPackageJson);
        } else {
          throw err;
        }
      }
    }

    nodeModulesPackagePathCache.set(pkgDepName, pkg);
    return pkg;
  };
}

/* eslint-disable max-lines */
const regularDependencyTypes = ['devDependencies', 'dependencies', 'optionalDependencies'];
function createCheckPackage(pkgDirectoryPath = '.') {
  const pkgDirname = path__default.resolve(pkgDirectoryPath);
  const pkgPathName = `${pkgDirectoryPath}/package.json`;
  const pkg = readPkgJson(`${pkgDirname}/package.json`);
  const getDependencyPackageJson = createGetDependencyPackageJson({
    pkgDirname
  });
  return {
    pkg,
    pkgDirname,
    pkgPathName,
    getDependencyPackageJson,

    checkExactVersions({
      onlyWarnsFor
    } = {}) {
      checkExactVersions(pkg, pkgPathName, 'dependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'resolutions', onlyWarnsFor);
      return this;
    },

    checkExactVersionsForLibrary({
      onlyWarnsFor
    } = {}) {
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      checkExactVersions(pkg, pkgPathName, 'resolutions', onlyWarnsFor);
      return this;
    },

    checkExactDevVersions({
      onlyWarnsFor
    } = {}) {
      checkExactVersions(pkg, pkgPathName, 'devDependencies', onlyWarnsFor);
      return this;
    },

    checkNoDependencies(type = 'dependencies', moveToSuggestion = 'devDependencies') {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({
      isLibrary = false,
      onlyWarnsFor
    } = {}) {
      regularDependencyTypes.forEach(depType => {
        if (!pkg[depType]) return;
        getKeys(pkg[depType]).forEach(depName => {
          const depPkg = getDependencyPackageJson(depName);

          if (depPkg.peerDependencies) {
            checkDirectPeerDependencies(isLibrary, pkg, pkgPathName, depType, depPkg, onlyWarnsFor);
          } // TODO optionalPeerDependency

        });
      });
      return this;
    },

    checkDirectDuplicateDependencies({
      onlyWarnsFor,
      internalWarnedForDuplicate
    } = {}) {
      const warnedForInternal = internalWarnedForDuplicate || new Set();
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
          checkDirectDuplicateDependencies(pkg, pkgPathName, 'dependencies', searchIn, depPkg, onlyWarnsFor, warnedForInternal);
        });
      });

      if (!warnedForInternal) {
        const reportError = createReportError('Direct Duplicate Dependencies', pkgPathName);
        checkWarnedFor(reportError, onlyWarnsFor, warnedForInternal);
      }

      return this;
    },

    checkResolutionsHasExplanation(checkMessage = () => undefined) {
      checkResolutionsHasExplanation(pkg, pkgPathName, checkMessage, getDependencyPackageJson);
      return this;
    },

    checkRecommended({
      isLibrary = false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      exactVersionsOnlyWarnsFor,
      checkResolutionMessage,
      internalWarnedForDuplicate
    } = {}) {
      if (isLibrary) {
        this.checkExactVersionsForLibrary({
          onlyWarnsFor: exactVersionsOnlyWarnsFor
        });
      } else {
        this.checkExactVersions({
          onlyWarnsFor: exactVersionsOnlyWarnsFor
        });
      }

      this.checkDirectPeerDependencies({
        isLibrary,
        onlyWarnsFor: peerDependenciesOnlyWarnsFor
      });
      this.checkDirectDuplicateDependencies({
        onlyWarnsFor: directDuplicateDependenciesOnlyWarnsFor,
        internalWarnedForDuplicate
      });
      this.checkResolutionsHasExplanation(checkResolutionMessage);
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

function createCheckPackageWithWorkspaces(pkgDirectoryPath = '.') {
  const checkPackage = createCheckPackage(pkgDirectoryPath);
  const {
    pkg,
    pkgDirname,
    pkgPathName
  } = checkPackage;
  const pkgWorkspaces = pkg.workspaces && !Array.isArray(pkg.workspaces) ? pkg.workspaces.packages : pkg.workspaces;

  if (!pkgWorkspaces) {
    throw new Error('Package is missing "workspaces"');
  }

  const workspacePackagesPaths = [];

  if (pkgWorkspaces) {
    pkgWorkspaces.forEach(pattern => {
      const match = glob__default.sync(`${pkgDirname}/${pattern}`);
      match.forEach(pathMatch => {
        const stat = fs__default.statSync(pathMatch);
        if (!stat.isDirectory()) return;
        const pkgDirectoryPath = path__default.relative(process.cwd(), pathMatch);
        workspacePackagesPaths.push(pkgDirectoryPath);
      });
    });
  }

  const checksWorkspaces = new Map(workspacePackagesPaths.map(pkgDirectoryPath => {
    const checkPkg = createCheckPackage(pkgDirectoryPath);
    return [checkPkg.pkg.name, checkPkg];
  }));
  return {
    checkRecommended({
      isLibrary = () => false,
      peerDependenciesOnlyWarnsFor,
      directDuplicateDependenciesOnlyWarnsFor,
      checkResolutionMessage
    } = {}) {
      const warnedForDuplicate = new Set();
      checkPackage.checkNoDependencies();
      checkPackage.checkRecommended({
        isLibrary: false,
        peerDependenciesOnlyWarnsFor,
        directDuplicateDependenciesOnlyWarnsFor,
        checkResolutionMessage,
        internalWarnedForDuplicate: warnedForDuplicate
      });
      checksWorkspaces.forEach((checkPackage, id) => {
        checkPackage.checkRecommended({
          isLibrary: isLibrary(id),
          peerDependenciesOnlyWarnsFor,
          directDuplicateDependenciesOnlyWarnsFor,
          exactVersionsOnlyWarnsFor: [...checksWorkspaces.keys()],
          checkResolutionMessage,
          internalWarnedForDuplicate: warnedForDuplicate
        });
        checkDirectDuplicateDependencies(checkPackage.pkg, checkPackage.pkgPathName, 'devDependencies', ['devDependencies', 'dependencies'], pkg, [], warnedForDuplicate);
      });
      checkWarnedFor(createReportError('Recommended Checks', pkgPathName), directDuplicateDependenciesOnlyWarnsFor, warnedForDuplicate);
      return this;
    },

    forRoot(callback) {
      callback(checkPackage);
      return this;
    },

    forEach(callback) {
      checksWorkspaces.forEach(checkPackage => {
        callback(checkPackage);
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
//# sourceMappingURL=index-node12-dev.cjs.js.map
