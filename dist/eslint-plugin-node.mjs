import path, { dirname } from 'node:path';
import fs, { constants } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { parseTree, findNodeAtLocation, getNodeValue } from 'jsonc-parser';
import { TextSourceCodeBase, VisitNodeStep } from '@eslint/plugin-kit';
import semver from 'semver';
import semverUtils from 'semver-utils';

const stripListItemValue = (rawValue) => {
  const withoutComment = rawValue.replace(/(?:^|\s)#.*$/, "").trim();
  const quoted = /^['"](.*)['"]$/.exec(withoutComment);
  return quoted ? quoted[1] : withoutComment;
};
const parseFlowSequence = (flowValue) => flowValue.replace(/^\[/, "").replace(/\]$/, "").split(",").map((item) => stripListItemValue(item)).filter((item) => item.length > 0);
const parsePnpmWorkspacePackages = (content) => {
  const lines = content.split(/\r?\n/);
  const packagesLineIndex = lines.findIndex(
    (line) => line.startsWith("packages:")
  );
  if (packagesLineIndex === -1) return [];
  const packagesLine = lines[packagesLineIndex];
  const inlineValue = packagesLine.slice("packages:".length).trim();
  if (inlineValue.startsWith("[")) {
    return parseFlowSequence(inlineValue);
  }
  const packages = [];
  for (let i = packagesLineIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    const trimmedLine = line.trimStart();
    if (line === trimmedLine || !trimmedLine.startsWith("-")) break;
    const value = stripListItemValue(trimmedLine.slice(1));
    if (value.length > 0) packages.push(value);
  }
  return packages;
};
const readPnpmWorkspacePackages = (dirname) => {
  const pnpmWorkspacePath = path.join(dirname, "pnpm-workspace.yaml");
  try {
    fs.accessSync(pnpmWorkspacePath, constants.R_OK);
  } catch {
    return void 0;
  }
  const content = fs.readFileSync(pnpmWorkspacePath, "utf8");
  const packages = parsePnpmWorkspacePackages(content);
  return packages.length > 0 ? packages : void 0;
};
const resolveWorkspacesPackagesGlobs = (pkgValue, packagePath) => (pkgValue.workspaces && !Array.isArray(pkgValue.workspaces) ? pkgValue.workspaces.packages : pkgValue.workspaces) ?? readPnpmWorkspacePackages(path.dirname(packagePath));

if (typeof findPackageJSON !== "function") {
  throw new Error("check-package-dependencies requires node >= 22.14.0");
}
function readPkgJson(packagePath) {
  return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}
function stringifyPkgJson(pkg) {
  return `${JSON.stringify(pkg, null, 2)}
`;
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
    workspacesPackages: resolveWorkspacesPackagesGlobs(value, packagePath),
    ...Object.fromEntries(
      dependencyFieldNames.map(
        (fieldName) => parseDependencyField(json, fieldName, packageContent)
      )
    )
  };
}
function readAndParsePkgJson(packagePath) {
  return parsePkg(fs.readFileSync(packagePath, "utf8"), packagePath);
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

class PackageJsonSourceCode extends TextSourceCodeBase {
  constructor({ text, ast }) {
    super({ text, ast });
  }
  getParent(node) {
    return void 0;
  }
  getAncestors(node) {
    return [];
  }
  traverse() {
    return [
      new VisitNodeStep({
        target: this.ast,
        phase: 1,
        args: [this.ast]
      }),
      ...this.ast.children.flatMap((child) => [
        new VisitNodeStep({
          target: child,
          phase: 1,
          args: [child]
        }),
        new VisitNodeStep({
          target: child,
          phase: 2,
          args: [child]
        })
      ]),
      new VisitNodeStep({
        target: this.ast,
        phase: 2,
        args: [this.ast]
      })
    ];
  }
  getText(node) {
    if ("type" in node) {
      if (node.type === "Package") {
        return stringifyPkgJson(this.ast.parsedPkgJson.value);
      }
    }
    throw new Error("Invalid node");
  }
  getLoc(node) {
    if ("type" in node) {
      if (node.type === "Package") {
        return { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } };
      }
      if (node.type === "DependencyValue") {
        const dependencyValueAst = node;
        const loc = dependencyValueAst.dependencyValue?.locations.all;
        if (!loc) throw new Error("Invalid node");
        return loc;
      }
    }
    throw new Error("Invalid node");
  }
}

const pluginNamespace = "check-package-dependencies";
const packageJsonLanguageName = "package-json";
const packageJsonLanguageId = `${pluginNamespace}/${packageJsonLanguageName}`;
const PackageJSONLanguage = {
  fileType: "text",
  lineStart: 1,
  columnStart: 1,
  nodeTypeKey: "type",
  visitorKeys: {
    Package: ["DependencyValue"],
    DependencyValue: []
  },
  validateLanguageOptions(languageOptions) {
  },
  parse(file, context) {
    if (typeof file.body !== "string") {
      throw new TypeError("File body is not a string");
    }
    try {
      const parsedPkgJson = parsePkg(file.body, file.path);
      const getDependencyPackageJson = createGetDependencyPackageJson({
        pkgDirname: dirname(file.path)
      });
      return {
        ok: true,
        ast: {
          type: "Package",
          parsedPkgJson,
          getDependencyPackageJson,
          loc: { line: 1, column: 1 },
          value: file.body,
          range: [0, file.body.length],
          children: [
            "dependencies",
            "devDependencies",
            "optionalDependencies",
            "peerDependencies",
            "resolutions",
            "resolutionsExplained"
          ].flatMap((dependencyType) => {
            return Object.values(parsedPkgJson[dependencyType] ?? {}).map(
              (dependencyValue) => {
                return {
                  type: "DependencyValue",
                  dependencyType,
                  parsedPkgJson,
                  getDependencyPackageJson,
                  dependencyValue,
                  loc: dependencyValue.locations.all.start,
                  range: dependencyValue.ranges.all,
                  value: dependencyValue.toString()
                };
              }
            );
          })
        }
      };
    } catch (error) {
      return {
        ok: false,
        errors: [
          {
            line: 1,
            column: 1,
            message: error instanceof Error ? error.message : String(error)
          }
        ]
      };
    }
  },
  createSourceCode(file, parseResult, context) {
    if (typeof file.body !== "string") {
      throw new TypeError("File body is not a string");
    }
    return new PackageJsonSourceCode({
      text: file.body,
      ast: parseResult.ast
    });
  }
};

semverUtils.parse;
semverUtils.parseRange;
function parseNpmAlias(version) {
  if (!version.startsWith("npm:")) return null;
  const target = version.slice("npm:".length);
  const rangeSeparatorIndex = target.indexOf(
    "@",
    target.startsWith("@") ? 1 : 0
  );
  if (rangeSeparatorIndex === -1) return { aliasedName: target, range: "*" };
  return {
    aliasedName: target.slice(0, rangeSeparatorIndex),
    range: target.slice(rangeSeparatorIndex + 1) || "*"
  };
}
function getRealVersion(version) {
  const npmAlias = parseNpmAlias(version);
  if (npmAlias) return npmAlias.range;
  if (version.startsWith("workspace:")) {
    const realVersion = version.slice("workspace:".length);
    if (realVersion === "~" || realVersion === "^") return "*";
    return realVersion;
  }
  return version;
}

const getKeys = (o) => Object.keys(o);
const getEntries = (o) => Object.entries(o);

const commentByDependencyName = (onlyWarnsFor) => new Map(
  onlyWarnsFor.map(
    (entry) => typeof entry === "string" ? [entry, void 0] : [entry.name, entry.comment]
  )
);
const createOnlyWarnsForArrayCheck = (configName, onlyWarnsFor = []) => {
  const comments = commentByDependencyName(onlyWarnsFor);
  const notWarnedFor = new Set(comments.keys());
  return {
    configName,
    getNotWarnedFor: () => [...notWarnedFor],
    getCommentFor: (dependencyName) => comments.get(dependencyName),
    shouldWarnsFor(dependencyName) {
      if (comments.has(dependencyName)) {
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
    const comments = new Map(
      getEntries(onlyWarnsFor).map(([entryKey, entryValue]) => [
        entryKey,
        commentByDependencyName(entryValue ?? [])
      ])
    );
    const notWarnedFor = new Map(
      [...comments].map(([entryKey, entryComments]) => [
        entryKey,
        new Set(entryComments.keys())
      ])
    );
    return {
      configName,
      getNotWarnedFor: () => Object.fromEntries(
        [...notWarnedFor].filter(([, set]) => set.size > 0).map(([key, set]) => [key, [...set]])
      ),
      createFor(dependencyNameLevel1) {
        return {
          configName,
          getNotWarnedFor() {
            throw new Error("Invalid call to getNotWarnedFor()");
          },
          // the more specific entry explains the exception better than the "*" one
          getCommentFor: (dependencyName) => comments.get(dependencyNameLevel1)?.get(dependencyName) ?? comments.get("*")?.get(dependencyName),
          shouldWarnsFor(dependencyName) {
            if (comments.get("*")?.has(dependencyName)) {
              notWarnedFor.get("*")?.delete(dependencyName);
              return true;
            }
            if (comments.get(dependencyNameLevel1)?.has(dependencyName)) {
              notWarnedFor.get(dependencyNameLevel1)?.delete(dependencyName);
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
        getCommentFor: (dependencyName) => arrayOnlyWarnsForCheck.getCommentFor(dependencyName),
        shouldWarnsFor(dependencyName) {
          return arrayOnlyWarnsForCheck.shouldWarnsFor(dependencyName);
        }
      };
    }
  };
};
const warnDetails = (onlyWarnsForCheck, dependencyName) => {
  const onlyWarns = onlyWarnsForCheck?.shouldWarnsFor(dependencyName);
  const comment = onlyWarns ? onlyWarnsForCheck?.getCommentFor(dependencyName) : void 0;
  return comment === void 0 ? { onlyWarns } : { onlyWarns, comment };
};

const compareRangeMinimumVersions = (range, otherRange) => {
  const minVersion = semver.minVersion(range);
  const otherMinVersion = semver.minVersion(otherRange);
  if (!minVersion || !otherMinVersion || semver.eq(minVersion, otherMinVersion))
    return "unordered";
  return semver.lt(minVersion, otherMinVersion) ? "lower" : "higher";
};
function checkDuplicateDependencies({
  reportError,
  pkg,
  isPkgLibrary,
  depType,
  searchIn,
  depPkg,
  onlyWarnsForCheck,
  conflictOwnership
}) {
  const dependencies = depPkg[depType];
  if (!dependencies) return;
  const searchInExisting = searchIn.filter((type) => pkg[type]);
  const ownsUnorderedConflicts = !conflictOwnership || conflictOwnership.ownsUnorderedConflicts;
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
        if (pkg.resolutions?.[depKey]) {
          return;
        }
        const versionInType = versionsIn[index];
        const dependency = versionInType ? pkg[versionInType][depKey] : void 0;
        const reportDuplicate = (errorDetails2, fixTo) => {
          reportError({
            errorMessage: `Invalid duplicate dependency${dependency ? "" : `"${depKey}"`}`,
            errorDetails: errorDetails2,
            ...warnDetails(onlyWarnsForCheck, depKey),
            dependency,
            ...fixTo === void 0 ? {} : { fixTo, errorTarget: "dependencyValue" }
          });
        };
        const versionAlias = parseNpmAlias(versionValue);
        const depRangeAlias = parseNpmAlias(depRange);
        if (versionAlias?.aliasedName !== depRangeAlias?.aliasedName) {
          if (ownsUnorderedConflicts) {
            reportDuplicate(
              `"${versions[0].value}" and "${depRange}" from ${depPkg.name || ""} in ${depType} install different packages`
            );
          }
          return;
        }
        const versionRange = versionAlias?.range ?? versionValue;
        const depRangeRange = depRangeAlias?.range ?? depRange;
        const unsupportedRange = [versionRange, depRangeRange].find(
          (range) => semver.validRange(range) === null
        );
        if (unsupportedRange !== void 0) {
          if (ownsUnorderedConflicts) {
            reportError({
              errorMessage: `Unsupported range for "${depKey}"`,
              errorDetails: `"${unsupportedRange}" is not a valid semver range, "${versions[0].value}" cannot be compared with "${depRange}" from ${depPkg.name || ""} in ${depType}`,
              ...warnDetails(onlyWarnsForCheck, depKey),
              dependency
            });
          }
          return;
        }
        if (semver.satisfies(versionRange, depRangeRange, {
          includePrerelease: true
        }) || semver.intersects(versionRange, depRangeRange, {
          includePrerelease: true
        })) {
          return;
        }
        const errorDetails = `"${versions[0].value}" should satisfies "${depRange}" from ${depPkg.name || ""} in ${depType}`;
        if (!conflictOwnership) {
          reportDuplicate(errorDetails);
          return;
        }
        const comparison = compareRangeMinimumVersions(
          versionRange,
          depRangeRange
        );
        if (comparison === "higher") return;
        if (comparison === "unordered") {
          if (ownsUnorderedConflicts) reportDuplicate(errorDetails);
          return;
        }
        reportDuplicate(errorDetails, depRange);
      });
    }
  }
}

function fromDependency(depPkg, depType) {
  return `from "${depPkg.name || ""}"${depType ? ` in "${depType}"` : ""}`;
}
function inDependency(depPkg, depType) {
  return `in ${depType ? `"${depType}" of ` : ""}"${depPkg.name || ""}"`;
}

const isDevOnlyPeerDependency = (name, additionalNames) => name.startsWith("@types/") || name.endsWith("/types") || (additionalNames?.includes(name) ?? false);
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
        ...warnDetails(invalidOnlyWarnsForCheck, peerDepName)
      });
    }
  });
}
function checkPeerDependencies(reportError, pkg, type, allowedPeerIn, allowMissing, providedDependencies, depPkg, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck, allowedPeerInDevDependencies) {
  const { peerDependencies, peerDependenciesMeta } = depPkg;
  if (!peerDependencies) return;
  for (const [peerDepName, range] of Object.entries(peerDependencies)) {
    const allowedPeerInForDep = isDevOnlyPeerDependency(peerDepName, allowedPeerInDevDependencies) && !allowedPeerIn.includes("devDependencies") ? [...allowedPeerIn, "devDependencies"] : allowedPeerIn;
    const allowedPeerInExisting = allowedPeerInForDep.filter(
      (allowedPeerInType) => pkg[allowedPeerInType]
    );
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
          ([, depRange]) => semver.intersects(range, getRealVersion(depRange))
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
        errorDetails: `it should satisfies "${range}" and be in ${allowedPeerInForDep.join(" or ")}${additionalDetails}`,
        dependency: { name: peerDepName },
        ...warnDetails(missingOnlyWarnsForCheck, peerDepName)
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
function checkDirectPeerDependencies(reportError, isLibrary, pkg, getDependencyPackageJson, missingOnlyWarnsForCheck, invalidOnlyWarnsForCheck, allowedPeerInDevDependencies) {
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
          getRealVersion(dependencies[depName].value),
          getRealVersion(pkg.peerDependencies[depName].value)
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
        invalidOnlyWarnsForCheck.createFor(depName),
        allowedPeerInDevDependencies
      );
    }
  }
}

const memberDeclaredDependencyTypes = [
  "devDependencies",
  "dependencies",
  "peerDependencies",
  "optionalDependencies"
];
const isPeerDependencyDeclaredInPackage = (pkg, peerDepName) => memberDeclaredDependencyTypes.some((depType) => pkg[depType]?.[peerDepName]);
function checkWorkspaceMemberPeerDependencies(reportError, {
  rootPkg,
  memberPkg,
  getDependencyPackageJson,
  onlyWarnsForMappingCheck
}) {
  regularDependencyTypes.forEach((depType) => {
    const dependencies = memberPkg[depType];
    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      if (rootPkg.devDependencies?.[depName]) {
        continue;
      }
      const [depPkg] = getDependencyPackageJson(depName);
      if (!depPkg.peerDependencies) continue;
      for (const [peerDepName, range] of Object.entries(
        depPkg.peerDependencies
      )) {
        if (isPeerDependencyDeclaredInPackage(memberPkg, peerDepName)) continue;
        checkSatisfiesPeerDependency(
          reportError,
          rootPkg,
          depType,
          ["devDependencies"],
          peerDepName,
          range,
          depPkg,
          onlyWarnsForMappingCheck.createFor(depName)
        );
      }
    }
  });
}

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

const commentSchema = { type: "string" };
const resolveCommentedRange = (value) => typeof value === "string" ? { range: value } : value;
const omitComment = ({
  comment,
  ...entry
}) => entry;

const renamedFromIsLibrary = 'was renamed to "library", which also accepts "auto" (the default) and a list of package name patterns such as ["@scope/*", "!@scope/app-*"]';
const legacyIsLibrarySettingMessage = `The "isLibrary" setting ${renamedFromIsLibrary}`;
function detectIsLibrary(pkg) {
  if (pkg.workspacesPackages) return false;
  return pkg.value.private !== true;
}
const parsePackageNamePattern = (pattern) => {
  const isLibrary = !pattern.startsWith("!");
  const namePattern = isLibrary ? pattern : pattern.slice(1);
  if (!namePattern.includes("*")) {
    return { isLibrary, matches: (packageName) => packageName === namePattern };
  }
  const regExp = new RegExp(
    `^${namePattern.split("*").map((part) => part.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&")).join(".*")}$`
  );
  return { isLibrary, matches: (packageName) => regExp.test(packageName) };
};
const matchesPackageNamePatterns = (patterns, packageName) => {
  let isLibrary = false;
  for (const pattern of patterns) {
    const parsedPattern = parsePackageNamePattern(pattern);
    if (parsedPattern.matches(packageName)) {
      isLibrary = parsedPattern.isLibrary;
    }
  }
  return isLibrary;
};
function resolveIsLibrary(setting, pkg) {
  if (setting === void 0 || setting === "auto") return detectIsLibrary(pkg);
  if (Array.isArray(setting)) {
    return matchesPackageNamePatterns(setting, pkg.name);
  }
  return setting;
}

const readPackageJsonSafe = (packageJsonPath) => {
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch {
    return void 0;
  }
};
const findWorkspaceRootLocation = (startDirname) => {
  for (let dirname = startDirname; ; ) {
    const packageJsonPath = path.join(dirname, "package.json");
    const pkgValue = readPackageJsonSafe(packageJsonPath);
    if (pkgValue) {
      const globs = resolveWorkspacesPackagesGlobs(pkgValue, packageJsonPath);
      if (globs) {
        return { dirname, packageJsonPath, globs };
      }
    }
    const parentDirname = path.dirname(dirname);
    if (parentDirname === dirname) return void 0;
    dirname = parentDirname;
  }
};
const findWorkspaceMemberNames = (startDirname) => {
  const root = findWorkspaceRootLocation(startDirname);
  if (!root) return void 0;
  const names = /* @__PURE__ */ new Set();
  for (const match of fs.globSync(root.globs, { cwd: root.dirname })) {
    const memberPkg = readPackageJsonSafe(path.join(match, "package.json"));
    if (memberPkg?.name) names.add(memberPkg.name);
  }
  return names;
};
const findWorkspaceRootPackageJson = (startDirname) => {
  const root = findWorkspaceRootLocation(startDirname);
  if (!root) return void 0;
  return readAndParsePkgJson(root.packageJsonPath);
};

const onlyWarnsForEntrySchema = {
  oneOf: [
    { type: "string" },
    {
      type: "object",
      properties: { name: { type: "string" }, comment: commentSchema },
      required: ["name"],
      additionalProperties: false
    }
  ]
};
const onlyWarnsForArraySchema = {
  type: "array",
  items: onlyWarnsForEntrySchema
};
const onlyWarnsForMappingSchema = {
  type: "object",
  patternProperties: {
    "^.*$": onlyWarnsForArraySchema
  }
};
const legacySettingReportedFor = /* @__PURE__ */ new WeakSet();
const documentationUrlBase = "https://github.com/christophehurpeau/check-package-dependencies/blob/main/documentation/rules";
function createPackageRule(ruleName, schema, {
  docs,
  fixable = false,
  hasSuggestions = false,
  checkPackage,
  checkDependencyValue
}) {
  const schemaWithComment = schema && "properties" in schema ? {
    ...schema,
    properties: { ...schema.properties, comment: commentSchema }
  } : schema;
  return {
    [ruleName]: {
      meta: {
        type: "problem",
        languages: [packageJsonLanguageId],
        docs: {
          description: docs.description,
          recommended: docs.recommended,
          url: `${documentationUrlBase}/${ruleName}.md`
        },
        fixable: fixable ? "code" : void 0,
        hasSuggestions,
        schema: schemaWithComment ? [schemaWithComment] : void 0
      },
      create(context) {
        const options = context.options[0] ?? {};
        const settings = context.settings[pluginNamespace] ?? {};
        const isLibraryFor = (pkg) => resolveIsLibrary(settings.library, pkg);
        const getWorkspaceMemberNames = /* @__PURE__ */ (() => {
          let cached;
          let computed = false;
          return (pkg) => {
            if (!computed) {
              cached = findWorkspaceMemberNames(path.dirname(pkg.path));
              computed = true;
            }
            return cached;
          };
        })();
        const getWorkspaceRootPackageJson = /* @__PURE__ */ (() => {
          let cached;
          let computed = false;
          return (pkg) => {
            if (!computed) {
              cached = findWorkspaceRootPackageJson(path.dirname(pkg.path));
              computed = true;
            }
            return cached;
          };
        })();
        const schemaProperties = schema && "properties" in schema ? schema.properties : void 0;
        const onlyWarnsForCheck = schemaProperties && "onlyWarnsFor" in schemaProperties && schemaProperties.onlyWarnsFor.type === "array" && Array.isArray(options.onlyWarnsFor) ? createOnlyWarnsForArrayCheck("onlyWarnsFor", options.onlyWarnsFor) : createOnlyWarnsForArrayCheck("onlyWarnsFor", []);
        const onlyWarnsForMappingCheck = schemaProperties && "onlyWarnsFor" in schemaProperties && schemaProperties.onlyWarnsFor.type === "object" && typeof options.onlyWarnsFor === "object" ? createOnlyWarnsForMappingCheck(
          "onlyWarnsFor",
          options.onlyWarnsFor
        ) : createOnlyWarnsForMappingCheck("onlyWarnsFor", {});
        const createFix = (fallbackDependencyValue) => (fixer, details, fixTo) => {
          if (details.errorTarget !== "dependencyValue") return null;
          const targetDependencyValue = details.dependency ?? fallbackDependencyValue;
          const targetRange = targetDependencyValue?.ranges?.value;
          if (!targetRange) {
            return null;
          }
          return fixer.replaceTextRange(targetRange, JSON.stringify(fixTo));
        };
        const createReportError = (fix) => (details) => {
          const location = details.dependency && getLocFromDependency(details.dependency, details.errorTarget);
          const fixTo = details.fixTo;
          const suggestions = details.suggestions;
          const isWarn = details.onlyWarns;
          const dependencyInfo = details.dependency ? `${details.dependency.fieldName ? `${details.dependency.fieldName} > ` : ""}${details.dependency.name}: ` : "";
          const comment = details.comment ?? options.comment;
          const message = dependencyInfo + details.errorMessage + (details.errorDetails ? `: ${details.errorDetails}` : "") + (comment ? ` (${comment})` : "");
          if (isWarn) {
            const locationString = location ? `:${location.start.line}:${location.start.column}` : "";
            console.warn(
              `[warn] ${context.filename}${locationString} ${message} - ${ruleName}`
            );
          } else {
            context.report({
              message,
              // TODO improve this by using start+end
              loc: location ?? {
                start: { line: 1, column: 1 },
                end: { line: 1, column: 1 }
              },
              fix: fix && fixTo ? (fixer) => fix(fixer, details, fixTo) : void 0,
              suggest: fix && suggestions ? suggestions.map((suggestion) => ({
                desc: suggestion[2] || `Replace with ${suggestion[1]}`,
                fix: (fixer) => fix(
                  fixer,
                  { ...details, dependency: suggestion[0] },
                  suggestion[1]
                )
              })) : void 0
            });
          }
        };
        const describeNotWarnedFor = (onlyWarnsForCheck2, depName) => {
          const comment = onlyWarnsForCheck2.getCommentFor(depName);
          return `"${depName}"${comment ? ` (${comment})` : ""}`;
        };
        const checkOnlyWarnsForArray = (onlyWarnsForCheck2) => {
          const notWarnedFor = onlyWarnsForCheck2.getNotWarnedFor();
          if (notWarnedFor.length > 0) {
            context.report({
              message: `${onlyWarnsForCheck2.configName}: no warning was raised for ${notWarnedFor.map(
                (depName) => describeNotWarnedFor(onlyWarnsForCheck2, depName)
              ).join(", ")}. You should remove it or check if it is correct.`,
              loc: {
                start: { line: 1, column: 1 },
                end: { line: 1, column: 1 }
              }
            });
          }
        };
        const checkOnlyWarnsForMapping = (onlyWarnsForMappingCheck2) => {
          const notWarnedForMapping = onlyWarnsForMappingCheck2.getNotWarnedFor();
          getEntries(notWarnedForMapping).forEach(
            ([depNameOrStar, notWarnedFor]) => {
              const entryCheck = onlyWarnsForMappingCheck2.createFor(depNameOrStar);
              context.report({
                message: `${onlyWarnsForMappingCheck2.configName}: no warning was raised for "${depNameOrStar}" > ${notWarnedFor.map((depName) => describeNotWarnedFor(entryCheck, depName)).join(", ")}`,
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 }
                }
              });
            }
          );
        };
        return {
          Package(node) {
            if (!context.filename.endsWith("/package.json")) {
              context.report({
                message: "This rule is only applicable to package.json files",
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 }
                }
              });
            }
            if ("isLibrary" in settings && !legacySettingReportedFor.has(node)) {
              legacySettingReportedFor.add(node);
              context.report({
                message: legacyIsLibrarySettingMessage,
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 }
                }
              });
            }
            const { parsedPkgJson, getDependencyPackageJson } = node;
            const loadWorkspaceMemberPackageJsons = (workspaceRootPkg) => {
              const workspacePackagesPaths = [];
              const dirname = path.dirname(workspaceRootPkg.path);
              const pkgWorkspaces = workspaceRootPkg.workspacesPackages;
              if (!pkgWorkspaces) {
                throw new Error(
                  "Tried to load workspaces package.json but no workspaces found"
                );
              }
              const match = fs.globSync(pkgWorkspaces, { cwd: dirname });
              for (const pathMatch of match) {
                const pkgPath = path.join(dirname, pathMatch, "package.json");
                try {
                  fs.accessSync(pkgPath, constants.R_OK);
                } catch {
                  console.warn(
                    `[warn] ${workspaceRootPkg.path} workspaces: ignored potential directory, no package.json found: ${pathMatch}`
                  );
                  continue;
                }
                workspacePackagesPaths.push(pkgPath);
              }
              return workspacePackagesPaths.map((path2) => {
                try {
                  const body = fs.readFileSync(path2, "utf8");
                  const parsedPkgJson2 = parsePkg(body, path2);
                  return parsedPkgJson2;
                } catch (error) {
                  throw new Error(
                    `Failed to read workspace package.json "${path2}": ${String(error)}`,
                    { cause: error }
                  );
                }
              });
            };
            const loadWorkspaceMemberPackageJsonsMemoized = /* @__PURE__ */ (() => {
              const cacheByWorkspaceRootPath = /* @__PURE__ */ new Map();
              return (workspaceRootPkg) => {
                const cached = cacheByWorkspaceRootPath.get(
                  workspaceRootPkg.path
                );
                if (cached) return cached;
                const loaded = loadWorkspaceMemberPackageJsons(workspaceRootPkg);
                cacheByWorkspaceRootPath.set(workspaceRootPkg.path, loaded);
                return loaded;
              };
            })();
            try {
              if (checkPackage) {
                checkPackage({
                  node: parsedPkgJson,
                  pkg: parsedPkgJson,
                  getDependencyPackageJson,
                  loadWorkspaceMemberPackageJsons: loadWorkspaceMemberPackageJsonsMemoized,
                  getWorkspaceMemberNames: () => getWorkspaceMemberNames(parsedPkgJson),
                  getWorkspaceRootPackageJson: () => getWorkspaceRootPackageJson(parsedPkgJson),
                  // languageOptions,
                  settings,
                  isLibrary: isLibraryFor(parsedPkgJson),
                  ruleOptions: options,
                  onlyWarnsForCheck,
                  onlyWarnsForMappingCheck,
                  checkOnlyWarnsForArray,
                  checkOnlyWarnsForMapping,
                  reportError: createReportError(createFix())
                });
              }
            } catch (error) {
              context.report({
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 }
                },
                message: `Failed to check package dependencies: ${error instanceof Error ? error.message : String(error)}`
              });
            }
          },
          "Package:exit"() {
            try {
              checkOnlyWarnsForArray(onlyWarnsForCheck);
              checkOnlyWarnsForMapping(onlyWarnsForMappingCheck);
            } catch (error) {
              context.report({
                loc: {
                  start: { line: 1, column: 1 },
                  end: { line: 1, column: 1 }
                },
                message: `Failed to check package dependencies: ${error instanceof Error ? error.message : String(error)}`
              });
            }
          },
          ...checkDependencyValue ? {
            DependencyValue(node) {
              const token = node;
              const {
                dependencyValue,
                parsedPkgJson,
                getDependencyPackageJson
              } = token;
              if (!dependencyValue) return;
              checkDependencyValue({
                node: dependencyValue,
                pkg: parsedPkgJson,
                getDependencyPackageJson,
                getWorkspaceMemberNames: () => getWorkspaceMemberNames(parsedPkgJson),
                // languageOptions,
                settings,
                isLibrary: isLibraryFor(parsedPkgJson),
                ruleOptions: options,
                onlyWarnsForCheck,
                onlyWarnsForMappingCheck,
                reportError: createReportError(createFix(dependencyValue))
              });
            }
          } : {}
        };
      }
    }
  };
}

const duplicatesSearchInByDependencyType$1 = {
  devDependencies: ["devDependencies", "dependencies"],
  dependencies: ["devDependencies", "dependencies"],
  peerDependencies: ["peerDependencies"]
};
const isSamePackageJson = (pkg, otherPkg) => path.resolve(pkg.path) === path.resolve(otherPkg.path);
const isWorkspaceRoot = (pkg) => pkg.workspacesPackages !== void 0;
const ownsUnorderedConflictsWith = (pkg, otherPkg) => {
  if (isWorkspaceRoot(otherPkg)) return true;
  if (isWorkspaceRoot(pkg)) return false;
  if (pkg.name !== otherPkg.name) return pkg.name < otherPkg.name;
  return pkg.path < otherPkg.path;
};
const getOtherWorkspacePackages = ({
  pkg,
  loadWorkspaceMemberPackageJsons,
  getWorkspaceRootPackageJson
}) => {
  if (isWorkspaceRoot(pkg)) return loadWorkspaceMemberPackageJsons(pkg);
  const rootPkg = getWorkspaceRootPackageJson();
  if (!rootPkg) return void 0;
  const memberPkgs = loadWorkspaceMemberPackageJsons(rootPkg);
  if (!memberPkgs.some((memberPkg) => isSamePackageJson(memberPkg, pkg))) {
    return void 0;
  }
  return [
    rootPkg,
    ...memberPkgs.filter((memberPkg) => !isSamePackageJson(memberPkg, pkg))
  ];
};
const createReportErrorOnce = (reportError) => {
  const alreadyReported = /* @__PURE__ */ new Set();
  return (details) => {
    const reportKey = `${details.errorMessage}: ${String(details.errorDetails)}`;
    if (alreadyReported.has(reportKey)) return;
    alreadyReported.add(reportKey);
    reportError(details);
  };
};
const consistentWorkspaceDependenciesRule = createPackageRule(
  "consistent-workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Enforce consistent dependency versions across the packages of a workspace",
      recommended: true
    },
    fixable: true,
    checkPackage: ({
      pkg,
      reportError,
      loadWorkspaceMemberPackageJsons,
      getDependencyPackageJson,
      getWorkspaceRootPackageJson,
      onlyWarnsForMappingCheck,
      isLibrary
    }) => {
      const otherWorkspacePackages = getOtherWorkspacePackages({
        pkg,
        loadWorkspaceMemberPackageJsons,
        getWorkspaceRootPackageJson
      });
      if (!otherWorkspacePackages) return;
      const reportErrorOnce = createReportErrorOnce(reportError);
      for (const otherPkg of otherWorkspacePackages) {
        const conflictOwnership = {
          ownsUnorderedConflicts: ownsUnorderedConflictsWith(pkg, otherPkg)
        };
        getEntries(duplicatesSearchInByDependencyType$1).forEach(
          ([depType, searchIn]) => {
            if (!searchIn) return;
            checkDuplicateDependencies({
              reportError: reportErrorOnce,
              pkg,
              isPkgLibrary: isLibrary,
              depType,
              searchIn,
              depPkg: otherPkg.value,
              onlyWarnsForCheck: onlyWarnsForMappingCheck.createFor(
                otherPkg.name
              ),
              conflictOwnership
            });
          }
        );
      }
      if (isWorkspaceRoot(pkg)) return;
      checkWorkspaceMemberPeerDependencies(reportError, {
        rootPkg: getWorkspaceRootPackageJson(),
        memberPkg: pkg,
        getDependencyPackageJson,
        onlyWarnsForMappingCheck
      });
    }
  }
);

function checkDependencyMinRangeSatisfies(reportError, dependencyValue, pkg, dependencyType2) {
  if (!pkg[dependencyType2]) return;
  if (!dependencyValue) return;
  const range1 = getRealVersion(dependencyValue.value);
  if (range1 === "*") return;
  const depRange2 = pkg[dependencyType2][dependencyValue.name];
  if (!depRange2) return;
  const range2 = getRealVersion(depRange2.value);
  if (range2 === "*") return;
  const minDepRange1 = semver.minVersion(range1)?.version || range1;
  if (!semver.satisfies(minDepRange1, range2, {
    includePrerelease: true
  })) {
    const depRange1Parsed = semverUtils.parseRange(range1);
    reportError({
      errorMessage: `Invalid "${dependencyValue.value}" in "${dependencyValue.fieldName}"`,
      errorDetails: `"${dependencyValue.value}" should satisfies "${depRange2.value}" from "${dependencyType2}"`,
      dependency: dependencyValue,
      errorTarget: "dependencyValue",
      fixTo: (depRange1Parsed[0]?.operator || "") + (semver.minVersion(range2)?.version || range2)
    });
  }
}

const minRangeDependenciesSatisfiesDevDependenciesRule = createPackageRule(
  "min-range-dependencies-satisfies-dev-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Enforce the minimum of a `dependencies` range to satisfy the version in `devDependencies`",
      recommended: true
    },
    fixable: true,
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (node.fieldName === "dependencies") {
        checkDependencyMinRangeSatisfies(
          reportError,
          node,
          pkg,
          "devDependencies"
        );
      }
    }
  }
);

const minRangePeerDependenciesSatisfiesDependenciesRule = createPackageRule(
  "min-range-peer-dependencies-satisfies-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Enforce the minimum of a `peerDependencies` range to satisfy the version in `dependencies`",
      recommended: true
    },
    fixable: true,
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (node.fieldName === "peerDependencies") {
        checkDependencyMinRangeSatisfies(
          reportError,
          node,
          pkg,
          "dependencies"
        );
      }
    }
  }
);

const duplicatesSearchInByDependencyType = {
  devDependencies: ["devDependencies", "dependencies"],
  dependencies: ["devDependencies", "dependencies"]
};
const noDirectDuplicateDependenciesRule = createPackageRule(
  "no-direct-duplicate-dependencies",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForMappingSchema
    },
    additionalProperties: false
  },
  {
    docs: {
      description: "Disallow dependencies that will be installed twice because a direct dependency requires an incompatible range",
      recommended: true
    },
    checkDependencyValue: ({
      node,
      pkg,
      reportError,
      isLibrary,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForMappingCheck
    }) => {
      if (node.fieldName === "resolutionsExplained") {
        return;
      }
      const searchIn = duplicatesSearchInByDependencyType[node.fieldName];
      if (!searchIn) {
        return;
      }
      const [depPkg] = getDependencyPackageJson(node.name);
      checkDuplicateDependencies({
        reportError,
        pkg,
        isPkgLibrary: isLibrary,
        depType: "dependencies",
        searchIn,
        depPkg,
        onlyWarnsForCheck: onlyWarnsForMappingCheck.createFor(node.name)
      });
    }
  }
);

const noRootWorkspaceDependenciesRule = createPackageRule(
  "no-root-workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Disallow `dependencies` in the root package.json of a workspace",
      recommended: true
    },
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (!pkg.workspacesPackages) {
        return;
      }
      if (node.fieldName === "dependencies") {
        reportError({
          errorMessage: "Root workspace should not have dependencies",
          dependency: node
        });
      }
    }
  }
);

const requireDirectPeerDependenciesRule = createPackageRule(
  "require-direct-peer-dependencies",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForMappingSchema,
      onlyWarnsForMissing: onlyWarnsForMappingSchema,
      allowedPeerInDevDependencies: {
        type: "array",
        items: { type: "string" }
      }
    },
    additionalProperties: false
  },
  {
    docs: {
      description: "Require peer dependencies of direct dependencies to be present and satisfied",
      recommended: true
    },
    checkPackage: ({
      pkg,
      reportError,
      isLibrary,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForMappingCheck: invalidOnlyWarnsForCheck,
      checkOnlyWarnsForMapping
    }) => {
      const missingOnlyWarnsForCheck = createOnlyWarnsForMappingCheck(
        "onlyWarnsForMissing",
        ruleOptions.onlyWarnsForMissing
      );
      checkDirectPeerDependencies(
        reportError,
        isLibrary,
        pkg,
        getDependencyPackageJson,
        missingOnlyWarnsForCheck,
        invalidOnlyWarnsForCheck,
        ruleOptions.allowedPeerInDevDependencies
      );
      checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
    }
  }
);

function checkIdenticalVersionsThanDependency(reportError, pkg, type, depKeys, depPkg, dependencies = {}, {
  onlyWarnsForCheck,
  comment
} = {}) {
  const pkgDependencies = pkg[type] || {};
  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    const depValue = pkgDependencies[depKey];
    if (!version) {
      reportError({
        errorMessage: `Unexpected missing dependency "${depKey}" ${inDependency(depPkg)}`,
        errorDetails: `config expects "${depKey}" to be present`,
        ...comment !== void 0 && { comment }
      });
      return;
    }
    if (version.startsWith("^") || version.startsWith("~")) {
      reportError({
        errorMessage: `Unexpected range dependency "${depKey}" ${inDependency(depPkg)}`,
        errorDetails: "perhaps use checkSatisfiesVersionsFromDependency() instead",
        ...comment !== void 0 && { comment }
      });
      return;
    }
    const value = depValue?.value;
    if (!value) {
      reportError({
        errorMessage: `Missing "${depKey}"`,
        errorDetails: `expecting to be "${version}"`,
        dependency: { name: depKey, fieldName: type },
        ...warnDetails(onlyWarnsForCheck, depKey),
        ...comment !== void 0 && { comment }
      });
      return;
    }
    if (value !== version) {
      reportError({
        errorMessage: `Invalid "${value}"`,
        errorDetails: `expecting "${value}" to be "${version}" ${fromDependency(depPkg)}`,
        dependency: depValue,
        ...warnDetails(onlyWarnsForCheck, depKey),
        ...comment !== void 0 && { comment }
      });
    }
  });
}

const depGroupSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      type: "object",
      properties: {
        resolutions: { type: "array", items: { type: "string" } },
        dependencies: { type: "array", items: { type: "string" } },
        devDependencies: { type: "array", items: { type: "string" } },
        comment: commentSchema
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};
const requireIdenticalVersionsAsDependencyRule = createPackageRule(
  "require-identical-versions-as-dependency",
  {
    type: "object",
    properties: {
      dependencies: depGroupSchema,
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to have the same version as the one in the `dependencies` of another dependency",
      recommended: false
    },
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      Object.entries(ruleOptions.dependencies).forEach(
        ([depName, targets]) => {
          const [depPkg] = getDependencyPackageJson(depName);
          const destTypes = [
            "resolutions",
            "dependencies",
            "devDependencies"
          ];
          destTypes.forEach((destType) => {
            const depKeys = targets[destType];
            if (depKeys && depKeys.length > 0) {
              checkIdenticalVersionsThanDependency(
                reportError,
                pkg,
                destType,
                depKeys,
                depPkg,
                depPkg.dependencies,
                { onlyWarnsForCheck, comment: targets.comment }
              );
            }
          });
        }
      );
    }
  }
);

const requireIdenticalVersionsAsDevDependencyOfDependencyRule = createPackageRule(
  "require-identical-versions-as-dev-dependency-of-dependency",
  {
    type: "object",
    properties: {
      dependencies: depGroupSchema,
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to have the same version as the one in the `devDependencies` of another dependency",
      recommended: false
    },
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      Object.entries(ruleOptions.dependencies).forEach(
        ([depName, targets]) => {
          const [depPkg] = getDependencyPackageJson(depName);
          const destTypes = [
            "resolutions",
            "dependencies",
            "devDependencies"
          ];
          destTypes.forEach((destType) => {
            const depKeys = targets[destType];
            if (depKeys && depKeys.length > 0) {
              checkIdenticalVersionsThanDependency(
                reportError,
                pkg,
                destType,
                depKeys,
                depPkg,
                depPkg.devDependencies,
                { onlyWarnsForCheck, comment: targets.comment }
              );
            }
          });
        }
      );
    }
  }
);

function checkIdenticalVersions(reportError, pkg, type, deps, { onlyWarnsForCheck } = {}) {
  const pkgDependencies = pkg[type] || {};
  getKeys(deps).forEach((depKey) => {
    const depConfigArrayOrObject = deps[depKey];
    if (!depConfigArrayOrObject) {
      throw new Error(`depConfig is undefined for ${depKey}`);
    }
    const isArrayConfig = Array.isArray(depConfigArrayOrObject);
    const comment = isArrayConfig ? void 0 : depConfigArrayOrObject.comment;
    const depConfig = isArrayConfig ? { [type]: depConfigArrayOrObject } : omitComment(depConfigArrayOrObject);
    const version = pkgDependencies[depKey]?.value;
    if (!version) {
      reportError({
        errorMessage: `Unexpected missing ${type}`,
        errorDetails: `missing "${depKey}"`,
        ...comment !== void 0 && { comment }
      });
      return;
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
            ...warnDetails(onlyWarnsForCheck, depKey),
            ...comment !== void 0 && { comment }
          });
          return;
        }
        if (value !== version) {
          reportError({
            errorMessage: `Invalid "${depKeyIdentical}"`,
            errorDetails: `expecting "${value}" to be "${version}" identical to "${depKey}" in "${type}"`,
            dependency: depValue,
            ...warnDetails(onlyWarnsForCheck, depKey),
            ...comment !== void 0 && { comment },
            fixTo: version
          });
        }
      });
    });
  });
}

const depRecordSchema = {
  type: "object",
  patternProperties: {
    ".*": {
      oneOf: [
        { type: "array", items: { type: "string" } },
        {
          type: "object",
          properties: {
            resolutions: { type: "array", items: { type: "string" } },
            dependencies: { type: "array", items: { type: "string" } },
            devDependencies: { type: "array", items: { type: "string" } },
            comment: commentSchema
          },
          additionalProperties: false
        }
      ]
    }
  }
};
const sourceTypes = [
  "resolutions",
  "dependencies",
  "devDependencies"
];
const requireIdenticalVersionsRule = createPackageRule(
  "require-identical-versions",
  {
    type: "object",
    properties: {
      resolutions: depRecordSchema,
      dependencies: depRecordSchema,
      devDependencies: depRecordSchema,
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to have the same version as another dependency of the same package.json",
      recommended: false
    },
    checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
      sourceTypes.forEach((type) => {
        const deps = ruleOptions[type];
        if (deps) {
          checkIdenticalVersions(reportError, pkg, type, deps, {
            onlyWarnsForCheck
          });
        }
      });
    }
  }
);

const isVersionRange = (version) => version.startsWith("^") || version.startsWith("~") || version.startsWith(">") || version.startsWith("<");
const getExactVersionFromRange = (version) => {
  const exactVersion = version.slice(version[1] === "=" ? 2 : 1);
  const parts = exactVersion.split(".").length;
  if (parts === 1) return `${exactVersion}.0.0`;
  if (parts === 2) return `${exactVersion}.0`;
  return exactVersion;
};
function checkExactVersion(reportError, dependencyValue, { getDependencyPackageJson, onlyWarnsForCheck }) {
  const dependencyName = dependencyValue.name;
  const version = getRealVersion(dependencyValue.value);
  if (!isVersionRange(version)) return;
  const warn = warnDetails(onlyWarnsForCheck, dependencyName);
  const shouldOnlyWarn = warn.onlyWarns === true;
  if (shouldOnlyWarn || !getDependencyPackageJson) {
    reportError({
      errorMessage: "Unexpected range value",
      errorDetails: `expecting "${version}" to be exact "${getExactVersionFromRange(version)}"`,
      errorTarget: "dependencyValue",
      dependency: dependencyValue,
      ...warn
    });
    return;
  }
  const resolvedDep = (() => {
    try {
      const [dep] = getDependencyPackageJson(dependencyName);
      return dep;
    } catch {
      return null;
    }
  })();
  if (!resolvedDep?.version || !semver.satisfies(resolvedDep.version, version, {
    includePrerelease: true
  })) {
    reportError({
      errorMessage: "Unexpected range value",
      errorDetails: `expecting "${version}" to be exact`,
      errorTarget: "dependencyValue",
      dependency: dependencyValue,
      ...warn
    });
    return;
  }
  reportError({
    errorMessage: "Unexpected range value",
    errorDetails: `expecting "${version}" to be exact "${resolvedDep.version}"`,
    errorTarget: "dependencyValue",
    dependency: dependencyValue,
    ...warn,
    fixTo: resolvedDep.version
  });
}

const pinnedDependencyTypes = [
  "dependencies",
  "devDependencies",
  "resolutions"
];
const requirePinnedVersionsRule = createPackageRule(
  "require-pinned-versions",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    additionalProperties: false
  },
  {
    docs: {
      description: "Require pinned versions in `dependencies`, `devDependencies` and `resolutions`",
      recommended: true
    },
    fixable: true,
    checkDependencyValue: ({
      node,
      reportError,
      isLibrary,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      if (!pinnedDependencyTypes.includes(node.fieldName)) return;
      if (isLibrary && node.fieldName === "dependencies") return;
      checkExactVersion(reportError, node, {
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    }
  }
);

function checkResolutionHasExplanation(reportError, dependencyValue, pkg) {
  if (!pkg.resolutionsExplained?.[dependencyValue.name]) {
    reportError({
      errorMessage: `Missing "${dependencyValue.name}" in "resolutionsExplained"`,
      dependency: dependencyValue
    });
  }
}
function checkResolutionExplanation(reportError, dependencyValue, pkg) {
  if (!pkg.resolutions?.[dependencyValue.name]) {
    reportError({
      errorMessage: `Found "${dependencyValue.name}" in "resolutionsExplained" but not in "resolutions"`,
      dependency: dependencyValue
    });
  }
}

const requireResolutionsExplanationRule = createPackageRule(
  "require-resolutions-explanation",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Require every entry of `resolutions` to be explained in `resolutionsExplained`",
      recommended: true
    },
    checkDependencyValue: ({ node, reportError, pkg }) => {
      if (node.fieldName === "resolutions") {
        checkResolutionHasExplanation(reportError, node, pkg);
      } else if (node.fieldName === "resolutionsExplained") {
        checkResolutionExplanation(reportError, node, pkg);
      }
    }
  }
);

const WORKSPACE_PROTOCOL_PREFIX = "workspace:";
const DEP_TYPES_TO_CHECK = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies"
];
const getWorkspaceProtocolFixTo = (value) => {
  if (value.startsWith("^")) return "workspace:^";
  if (value.startsWith("~")) return "workspace:~";
  return "workspace:*";
};
const requireWorkspaceProtocolRule = createPackageRule(
  "require-workspace-protocol",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Require dependencies on other packages of the workspace to use the `workspace:` protocol",
      recommended: true
    },
    fixable: true,
    checkDependencyValue: ({ node, reportError, getWorkspaceMemberNames }) => {
      if (!DEP_TYPES_TO_CHECK.includes(node.fieldName)) {
        return;
      }
      const workspaceMemberNames = getWorkspaceMemberNames();
      if (workspaceMemberNames?.has(node.name) && !node.value.startsWith(WORKSPACE_PROTOCOL_PREFIX)) {
        reportError({
          errorMessage: `Dependency "${node.name}" should use workspace protocol (workspace:, workspace:*, workspace:^, or workspace:~) instead of "${node.value}"`,
          dependency: node,
          errorTarget: "dependencyValue",
          fixTo: getWorkspaceProtocolFixTo(node.value)
        });
      }
    }
  }
);

function checkResolutionVersionMatch(reportError, pkg, resolutionValue) {
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
    const realRange = getRealVersion(range.value);
    if (realRange === "*") return;
    if (!semver.satisfies(resolutionDepVersion, realRange, {
      includePrerelease: true
    })) {
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
  });
}

const resolutionsVersionsMatchRule = createPackageRule(
  "resolutions-versions-match",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    docs: {
      description: "Require `resolutions` versions to match the versions in `dependencies` and `devDependencies`",
      recommended: true
    },
    hasSuggestions: true,
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (node.fieldName === "resolutions") {
        checkResolutionVersionMatch(reportError, pkg, node);
      }
    }
  }
);

function isVersionSatisfiesRange(version, range) {
  const realVersion = getRealVersion(version);
  if (realVersion === "*") return true;
  const minVersionOfVersion = semver.minVersion(realVersion);
  return !!minVersionOfVersion && semver.satisfies(minVersionOfVersion, getRealVersion(range), {
    includePrerelease: true
  });
}
function checkSatisfiesVersion(reportError, dependencyValue, rangeConfig, onlyWarnsForCheck) {
  const { range, comment } = resolveCommentedRange(rangeConfig);
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
      ...warnDetails(onlyWarnsForCheck, dependencyValue.name),
      ...comment !== void 0 && { comment },
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
  Object.entries(dependenciesRanges).forEach(([name, rangeConfig]) => {
    const { range, comment } = resolveCommentedRange(rangeConfig);
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
        ...warnDetails(onlyWarnsForCheck, name),
        ...comment !== void 0 && { comment }
      });
    }
  });
}

function resolveSide({
  side,
  dependencyName,
  getDependencyPackageJson
}) {
  const depName = typeof side === "string" ? side : side.name;
  const depType = typeof side === "string" ? "dependencies" : side.in ?? "dependencies";
  const [depPkg] = getDependencyPackageJson(depName);
  const range = depPkg[depType]?.[dependencyName];
  if (!range) {
    throw new Error(
      `Dependency "${depName}" has no dependency "${dependencyName}" in "${depType}"`
    );
  }
  return { depName, depType, range };
}
function checkSatisfiesVersionsBetweenDependencies(reportError, dependencyValue, {
  dependencies,
  getDependencyPackageJson,
  onlyWarnsForCheck
}) {
  if (!regularDependencyTypes.includes(dependencyValue.fieldName)) {
    return;
  }
  dependencies.forEach(({ name, from, to, comment }) => {
    const fromName = typeof from === "string" ? from : from.name;
    if (fromName !== dependencyValue.name) return;
    const fromSide = resolveSide({
      side: from,
      dependencyName: name,
      getDependencyPackageJson
    });
    const toSide = resolveSide({
      side: to,
      dependencyName: name,
      getDependencyPackageJson
    });
    if (!isVersionSatisfiesRange(fromSide.range, toSide.range)) {
      reportError({
        errorMessage: `Version not satisfied between dependencies for dependency "${name}"`,
        errorDetails: `"${fromSide.range}" from "${fromSide.depName}" ${fromSide.depType} should satisfies "${toSide.range}" from "${toSide.depName}" ${toSide.depType}`,
        ...warnDetails(onlyWarnsForCheck, dependencyValue.name),
        ...comment !== void 0 && { comment }
      });
    }
  });
}

const satisfiesVersionsBetweenDependenciesRule = createPackageRule(
  "satisfies-versions-between-dependencies",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            from: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    in: { type: "string" }
                  },
                  required: ["name"],
                  additionalProperties: false
                }
              ]
            },
            to: {
              oneOf: [
                { type: "string" },
                {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    in: { type: "string" }
                  },
                  required: ["name"],
                  additionalProperties: false
                }
              ]
            },
            comment: commentSchema
          },
          required: ["name", "from", "to"],
          additionalProperties: false
        }
      }
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require the range of a dependency in one dependency to satisfy the range of the same dependency in another dependency",
      recommended: false
    },
    checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
      ruleOptions.dependencies.forEach(({ from, comment }) => {
        checkMissingSatisfiesVersions(
          reportError,
          pkg,
          regularDependencyTypes,
          {
            [typeof from === "string" ? from : from.name]: {
              range: "*",
              comment
            }
          },
          onlyWarnsForCheck
        );
      });
    },
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      onlyWarnsForCheck,
      getDependencyPackageJson
    }) => {
      checkSatisfiesVersionsBetweenDependencies(reportError, node, {
        dependencies: ruleOptions.dependencies,
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    }
  }
);

function getRangeInDependency({
  depName,
  depPkg,
  readRangesFrom,
  dependencyName
}) {
  const range = depPkg[readRangesFrom]?.[dependencyName];
  if (!range) {
    throw new Error(
      `Dependency "${depName}" has no "${dependencyName}" in "${readRangesFrom}"`
    );
  }
  return range;
}
function checkMissingSatisfiesVersionsFromDependency(reportError, pkg, {
  dependencies,
  readRangesFrom,
  getDependencyPackageJson,
  onlyWarnsForCheck
}) {
  getEntries(dependencies).forEach(([depName, dependencyNamesByType]) => {
    const [depPkg] = getDependencyPackageJson(depName);
    regularDependencyTypes.forEach((type) => {
      const dependencyNames = dependencyNamesByType[type];
      if (!dependencyNames) return;
      checkMissingSatisfiesVersions(
        reportError,
        pkg,
        type,
        Object.fromEntries(
          dependencyNames.map((dependencyName) => [
            dependencyName,
            {
              range: getRangeInDependency({
                depName,
                depPkg,
                readRangesFrom,
                dependencyName
              }),
              comment: dependencyNamesByType.comment
            }
          ])
        ),
        onlyWarnsForCheck
      );
    });
  });
}
function checkDependencySatisfiesVersionFromDependency(reportError, dependencyValue, {
  dependencies,
  readRangesFrom,
  getDependencyPackageJson,
  onlyWarnsForCheck
}) {
  if (!regularDependencyTypes.includes(dependencyValue.fieldName)) {
    return;
  }
  const fieldName = dependencyValue.fieldName;
  getEntries(dependencies).forEach(([depName, dependencyNamesByType]) => {
    if (!dependencyNamesByType[fieldName]?.includes(dependencyValue.name)) {
      return;
    }
    const [depPkg] = getDependencyPackageJson(depName);
    checkSatisfiesVersion(
      reportError,
      dependencyValue,
      {
        range: getRangeInDependency({
          depName,
          depPkg,
          readRangesFrom,
          dependencyName: dependencyValue.name
        }),
        comment: dependencyNamesByType.comment
      },
      onlyWarnsForCheck
    );
  });
}

const satisfiesVersionsFromDependenciesRule = createPackageRule(
  "satisfies-versions-from-dependencies",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        patternProperties: {
          ".*": {
            type: "object",
            properties: {
              dependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              devDependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              optionalDependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              comment: commentSchema
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to satisfy the ranges declared in the `dependencies` of another dependency",
      recommended: false
    },
    hasSuggestions: true,
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      checkMissingSatisfiesVersionsFromDependency(reportError, pkg, {
        dependencies: ruleOptions.dependencies,
        readRangesFrom: "dependencies",
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    },
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      onlyWarnsForCheck,
      getDependencyPackageJson
    }) => {
      checkDependencySatisfiesVersionFromDependency(reportError, node, {
        dependencies: ruleOptions.dependencies,
        readRangesFrom: "dependencies",
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    }
  }
);

const satisfiesVersionsFromDevDependenciesOfDependencyRule = createPackageRule(
  "satisfies-versions-from-dev-dependencies-of-dependency",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        patternProperties: {
          ".*": {
            type: "object",
            properties: {
              dependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              devDependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              optionalDependencies: {
                type: "array",
                items: { type: "string" },
                optional: true
              },
              comment: commentSchema
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to satisfy the ranges declared in the `devDependencies` of another dependency",
      recommended: false
    },
    hasSuggestions: true,
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      checkMissingSatisfiesVersionsFromDependency(reportError, pkg, {
        dependencies: ruleOptions.dependencies,
        readRangesFrom: "devDependencies",
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    },
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      onlyWarnsForCheck,
      getDependencyPackageJson
    }) => {
      checkDependencySatisfiesVersionFromDependency(reportError, node, {
        dependencies: ruleOptions.dependencies,
        readRangesFrom: "devDependencies",
        getDependencyPackageJson,
        onlyWarnsForCheck
      });
    }
  }
);

function checkSatisfiesVersionsInDependency(reportError, depPkg, dependenciesRangesConfig) {
  const { comment } = dependenciesRangesConfig;
  const dependenciesRanges = omitComment(dependenciesRangesConfig);
  const commentDetails = comment !== void 0 && { comment };
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
            dependency: { name: dependencyName },
            ...commentDetails
          });
        }
      } else if (!dependencies) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependenciesType}" is missing`,
          dependency: { name: dependencyName },
          ...commentDetails
        });
      } else if (!dependencies[dependencyName]) {
        reportError({
          errorMessage: `Missing "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencyName}" is missing but should satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName },
          ...commentDetails
        });
      } else if (getRealVersion(dependencies[dependencyName]) !== "*" && !semver.satisfies(
        getRealVersion(dependencies[dependencyName]),
        dependencyRange,
        {
          includePrerelease: true
        }
      ) && !semver.intersects(
        getRealVersion(dependencies[dependencyName]),
        dependencyRange,
        {
          includePrerelease: true
        }
      )) {
        reportError({
          errorMessage: `Invalid "${dependencyName}" ${inDependency(depPkg, dependenciesType)}`,
          errorDetails: `"${dependencies[dependencyName]}" does not satisfies "${dependencyRange}"`,
          dependency: { name: dependencyName },
          ...commentDetails
        });
      }
    }
  }
}

const depTypeRangesSchema = {
  type: "object",
  patternProperties: {
    ".*": { type: ["string", "null"] }
  }
};
const satisfiesVersionsInDependencyRule = createPackageRule(
  "satisfies-versions-in-dependency",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        patternProperties: {
          ".*": {
            type: "object",
            properties: {
              resolutions: depTypeRangesSchema,
              dependencies: depTypeRangesSchema,
              devDependencies: depTypeRangesSchema,
              peerDependencies: depTypeRangesSchema,
              optionalDependencies: depTypeRangesSchema,
              comment: commentSchema
            },
            additionalProperties: false
          }
        }
      },
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    required: ["dependencies"],
    additionalProperties: false
  },
  {
    docs: {
      description: "Require the dependencies of an installed dependency to satisfy the configured ranges",
      recommended: false
    },
    checkPackage: ({ reportError, ruleOptions, getDependencyPackageJson }) => {
      Object.entries(ruleOptions.dependencies).forEach(([depName, ranges]) => {
        const [depPkg] = getDependencyPackageJson(depName);
        checkSatisfiesVersionsInDependency(reportError, depPkg, ranges);
      });
    }
  }
);

const commentedRangeSchema = {
  oneOf: [
    { type: "string" },
    {
      type: "object",
      properties: { range: { type: "string" }, comment: commentSchema },
      required: ["range"],
      additionalProperties: false
    }
  ]
};
const satisfiesVersionsRule = createPackageRule(
  "satisfies-versions",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        additionalProperties: commentedRangeSchema
      },
      devDependencies: {
        type: "object",
        additionalProperties: commentedRangeSchema
      },
      optionalDependencies: {
        type: "object",
        additionalProperties: commentedRangeSchema
      },
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    additionalProperties: false
  },
  {
    docs: {
      description: "Require configured dependencies to be present and to satisfy the configured ranges",
      recommended: false
    },
    hasSuggestions: true,
    checkPackage: ({ pkg, reportError, ruleOptions, onlyWarnsForCheck }) => {
      if (!ruleOptions.dependencies && !ruleOptions.devDependencies) {
        throw new Error(
          'Rule "check-package-dependencies/satisfies-versions" is enabled but no dependencies are configured to check'
        );
      }
      regularDependencyTypes.forEach((type) => {
        if (ruleOptions[type]) {
          checkMissingSatisfiesVersions(
            reportError,
            pkg,
            type,
            ruleOptions[type],
            onlyWarnsForCheck
          );
        }
      });
    },
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      onlyWarnsForCheck
    }) => {
      if (!regularDependencyTypes.includes(node.fieldName)) {
        return;
      }
      const fieldName = node.fieldName;
      if (ruleOptions[fieldName]?.[node.name]) {
        const rangeConfig = ruleOptions[fieldName][node.name];
        if (!rangeConfig) {
          throw new Error(
            `Range is undefined for ${node.name} in ${node.fieldName}`
          );
        }
        checkSatisfiesVersion(
          reportError,
          node,
          rangeConfig,
          onlyWarnsForCheck
        );
      }
    }
  }
);

const rules = {
  ...requireDirectPeerDependenciesRule,
  ...noDirectDuplicateDependenciesRule,
  ...requirePinnedVersionsRule,
  ...requireIdenticalVersionsRule,
  ...requireIdenticalVersionsAsDependencyRule,
  ...requireIdenticalVersionsAsDevDependencyOfDependencyRule,
  ...minRangeDependenciesSatisfiesDevDependenciesRule,
  ...minRangePeerDependenciesSatisfiesDependenciesRule,
  ...resolutionsVersionsMatchRule,
  ...satisfiesVersionsRule,
  ...requireResolutionsExplanationRule,
  ...noRootWorkspaceDependenciesRule,
  ...satisfiesVersionsFromDependenciesRule,
  ...satisfiesVersionsFromDevDependenciesOfDependencyRule,
  ...satisfiesVersionsInDependencyRule,
  ...satisfiesVersionsBetweenDependenciesRule,
  ...consistentWorkspaceDependenciesRule,
  ...requireWorkspaceProtocolRule
};

const checkPackagePlugin = {
  meta: {
    name: "eslint-plugin-check-package-dependencies",
    namespace: pluginNamespace
  },
  languages: {
    [packageJsonLanguageName]: PackageJSONLanguage
  },
  rules: {
    ...rules
  },
  configs: {
    base: {
      files: ["**/package.json"],
      language: packageJsonLanguageId,
      plugins: {}
    },
    recommended: {
      files: ["**/package.json"],
      language: packageJsonLanguageId,
      plugins: {},
      rules: {
        "check-package-dependencies/require-pinned-versions": "error",
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/require-direct-peer-dependencies": "error",
        "check-package-dependencies/no-direct-duplicate-dependencies": "error",
        "check-package-dependencies/require-resolutions-explanation": "error",
        "check-package-dependencies/no-root-workspace-dependencies": "error",
        "check-package-dependencies/consistent-workspace-dependencies": "error",
        "check-package-dependencies/require-workspace-protocol": "error",
        "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies": "error",
        "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies": "error"
      }
    }
  }
};
checkPackagePlugin.configs.base.plugins = {
  [pluginNamespace]: checkPackagePlugin
};
checkPackagePlugin.configs.recommended.plugins = {
  [pluginNamespace]: checkPackagePlugin
};

export { checkPackagePlugin as default };
//# sourceMappingURL=eslint-plugin-node.mjs.map
