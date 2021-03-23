import path from 'path';
import { intersects, minVersion, satisfies } from 'semver';
import chalk from 'chalk';
import fs, { readFileSync } from 'fs';
import glob from 'glob';

/* eslint-disable no-console */
let titleDisplayed = null;
let pkgPathDisplayed = null;
function logMessage(msgTitle, msgInfo, onlyWarns) {
  console.error(`${onlyWarns ? chalk.yellow(`⚠ ${msgTitle}`) : chalk.red(`❌ ${msgTitle}`)}${msgInfo ? `: ${msgInfo}` : ''}`);
}
function createReportError(title, pkgPathName) {
  return function reportError(msgTitle, msgInfo, onlyWarns) {
    if (titleDisplayed !== title || pkgPathName !== pkgPathDisplayed) {
      if (titleDisplayed) console.error();
      console.error(chalk.cyan(`== ${title} in ${pkgPathName} ==`));
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

        if (version.startsWith('file:')) return;

        if (intersects(version, range)) {
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

function checkExactVersions(pkg, pkgPathName, type) {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;
  const reportError = createReportError('Exact versions', pkgPathName);

  for (const [depKey, version] of Object.entries(pkgDependencies)) {
    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(`Unexpected range dependency in "${type}" for "${depKey}"`, `expecting "${version}" to be exact "${version.slice(1)}".`);
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

      reportError(`Missing "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}`, `it should satisfies "${range}"`, onlyWarnsFor.includes(peerDepKey));
    } else {
      const versions = versionsIn.map(type => pkg[type][peerDepKey]);

      if (versions.length > 1) {
        reportError(`${peerDepKey} is present in both devDependencies and dependencies`, 'place it only in dependencies');
        return;
      }

      versions.forEach((version, index) => {
        const minVersionOfVersion = minVersion(version);

        if (!minVersionOfVersion || !satisfies(minVersionOfVersion, range)) {
          reportError(`Invalid "${peerDepKey}" peer dependency`, `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`, onlyWarnsFor.includes(peerDepKey));
        }
      });
    }
  }
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
      const minVersionOfVersion = minVersion(version);

      if (!minVersionOfVersion || !satisfies(minVersionOfVersion, range)) {
        reportError(`Invalid "${depKey}" in ${type}`, `"${version}" (in "${depKey}") should satisfies "${range}" from "${depPkg.name}" ${depKey}.`, onlyWarnsFor.includes(depKey));
      }
    }
  });
}

function readPkgJson(packagePath) {
  return JSON.parse(readFileSync(packagePath, 'utf-8'));
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
function createCheckPackage(pkgDirectoryPath = '.') {
  const pkgDirname = path.resolve(pkgDirectoryPath);
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

    checkExactVersions() {
      checkExactVersions(pkg, pkgPathName, 'dependencies');
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      checkExactVersions(pkg, pkgPathName, 'resolutions');
      return this;
    },

    checkExactVersionsForLibrary() {
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      checkExactVersions(pkg, pkgPathName, 'resolutions');
      return this;
    },

    checkExactDevVersions() {
      checkExactVersions(pkg, pkgPathName, 'devDependencies');
      return this;
    },

    checkNoDependencies(type = 'dependencies', moveToSuggestion = 'devDependencies') {
      checkNoDependencies(pkg, pkgPathName, type, moveToSuggestion);
      return this;
    },

    checkDirectPeerDependencies({
      isLibrary,
      onlyWarnsFor
    } = {}) {
      const checks = [{
        type: 'devDependencies',
        allowedPeerIn: ['devDependencies', 'dependencies']
      }, {
        type: 'dependencies',
        allowedPeerIn: isLibrary ? ['devDependencies', 'dependencies'] : ['dependencies']
      }];
      checks.forEach(({
        type,
        allowedPeerIn
      }) => {
        if (!pkg[type]) return;
        getKeys(pkg[type]).forEach(depName => {
          const depPkg = getDependencyPackageJson(depName);

          if (depPkg.peerDependencies) {
            checkPeerDependencies(pkg, pkgPathName, type, allowedPeerIn, depPkg, onlyWarnsFor);
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
      checkResolutionMessage,
      internalWarnedForDuplicate
    } = {}) {
      if (isLibrary) {
        this.checkExactVersionsForLibrary();
      } else {
        this.checkExactVersions();
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
      const match = glob.sync(`${pkgDirname}/${pattern}`);
      match.forEach(pathMatch => {
        const stat = fs.statSync(pathMatch);
        if (!stat.isDirectory()) return;
        const pkgDirectoryPath = path.relative(process.cwd(), pathMatch);
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

export { createCheckPackage, createCheckPackageWithWorkspaces };
//# sourceMappingURL=index-node12.mjs.map
