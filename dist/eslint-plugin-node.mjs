import path, { dirname } from 'node:path';
import fs, { readFileSync, constants } from 'node:fs';
import { findPackageJSON } from 'node:module';
import { parseTree, findNodeAtLocation, getNodeValue } from 'jsonc-parser';
import { TextSourceCodeBase, VisitNodeStep } from '@eslint/plugin-kit';
import semver from 'semver';
import 'node:util';
import semverUtils from 'semver-utils';

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

const getKeys = (o) => Object.keys(o);
const getEntries = (o) => Object.entries(o);

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

const onlyWarnsForArraySchema = {
  type: "array",
  items: { type: "string" }
};
const onlyWarnsForMappingSchema = {
  type: "object",
  patternProperties: {
    "^.*$": onlyWarnsForArraySchema
  }
};
function createPackageRule(ruleName, schema, {
  checkPackage,
  checkDependencyValue
}) {
  return {
    [ruleName]: {
      meta: {
        type: "problem",
        fixable: "code",
        hasSuggestions: true,
        schema: schema ? [schema] : void 0
      },
      create(context) {
        const options = context.options[0] ?? {};
        const settings = context.settings["check-package-dependencies"] ?? {};
        const schemaProperties = schema && "properties" in schema ? schema.properties : void 0;
        const onlyWarnsForCheck = schemaProperties && "onlyWarnsFor" in schemaProperties && schemaProperties.onlyWarnsFor.type === "array" && Array.isArray(options.onlyWarnsFor) ? createOnlyWarnsForArrayCheck("onlyWarnsFor", options.onlyWarnsFor) : createOnlyWarnsForArrayCheck("onlyWarnsFor", []);
        const onlyWarnsForMappingCheck = schemaProperties && "onlyWarnsFor" in schemaProperties && schemaProperties.onlyWarnsFor.type === "object" && typeof options.onlyWarnsFor === "object" ? createOnlyWarnsForMappingCheck(
          "onlyWarnsFor",
          options.onlyWarnsFor
        ) : createOnlyWarnsForMappingCheck("onlyWarnsFor", {});
        const createReportError = (fix) => (details) => {
          const location = details.dependency && getLocFromDependency(details.dependency, details.errorTarget);
          const fixTo = details.fixTo;
          const suggestions = details.suggestions;
          const isWarn = details.onlyWarns;
          const dependencyInfo = details.dependency ? `${details.dependency.fieldName ? `${details.dependency.fieldName} > ` : ""}${details.dependency.name}: ` : "";
          const message = dependencyInfo + details.errorMessage + (details.errorDetails ? `: ${details.errorDetails}` : "");
          if (isWarn) {
            console.warn(`[warn] ${message} - ${ruleName}`);
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
        const checkOnlyWarnsForArray = (onlyWarnsForCheck2) => {
          const notWarnedFor = onlyWarnsForCheck2.getNotWarnedFor();
          if (notWarnedFor.length > 0) {
            context.report({
              message: `${onlyWarnsForMappingCheck.configName}: no warning was raised for ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}. You should remove it or check if it is correct.`,
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
              context.report({
                message: `${onlyWarnsForMappingCheck2.configName}: no warning was raised for "${depNameOrStar}" > ${notWarnedFor.map((depName) => `"${depName}"`).join(", ")}`,
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
            const { parsedPkgJson, getDependencyPackageJson } = node;
            const loadWorkspacePackageJsons = () => {
              const workspacePackagesPaths = [];
              const pkgWorkspaces = parsedPkgJson.value.workspaces && !Array.isArray(parsedPkgJson.value.workspaces) ? parsedPkgJson.value.workspaces.packages : parsedPkgJson.value.workspaces;
              if (!pkgWorkspaces) {
                throw new Error(
                  "Tried to load workspaces package.json but no workspaces found"
                );
              }
              const dirname = path.dirname(parsedPkgJson.path);
              const match = fs.globSync(pkgWorkspaces, { cwd: dirname });
              for (const pathMatch of match) {
                const subPkgPath = path.relative(process.cwd(), pathMatch);
                const pkgPath = path.join(subPkgPath, "package.json");
                try {
                  fs.accessSync(pkgPath, constants.R_OK);
                } catch {
                  console.log(
                    `Ignored potential directory, no package.json found: ${pathMatch}`
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
            try {
              if (checkPackage) {
                checkPackage({
                  node: parsedPkgJson,
                  pkg: parsedPkgJson,
                  getDependencyPackageJson,
                  loadWorkspacePackageJsons,
                  // languageOptions,
                  settings,
                  ruleOptions: options,
                  onlyWarnsForCheck,
                  onlyWarnsForMappingCheck,
                  checkOnlyWarnsForArray,
                  checkOnlyWarnsForMapping,
                  reportError: createReportError()
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
                // languageOptions,
                settings,
                ruleOptions: options,
                onlyWarnsForCheck,
                onlyWarnsForMappingCheck,
                reportError: createReportError((fixer, details, fixTo) => {
                  const targetDependencyValue = details.dependency || dependencyValue;
                  if (details.errorTarget !== "dependencyValue") {
                    throw new Error(
                      `Invalid or unsupported errorTarget: ${String(details.errorTarget)}`
                    );
                  }
                  targetDependencyValue.changeValue?.(fixTo);
                  if (!targetDependencyValue.ranges) {
                    return null;
                  }
                  const getTargetRangeFromErrorTarget = (errorTarget) => {
                    switch (errorTarget) {
                      case "dependencyValue":
                        return targetDependencyValue.ranges?.value;
                      case "dependencyName":
                        return targetDependencyValue.ranges?.name;
                      case void 0:
                      default:
                        return targetDependencyValue.ranges?.all;
                    }
                  };
                  const targetRange = getTargetRangeFromErrorTarget(
                    details.errorTarget
                  );
                  if (!targetRange) {
                    return null;
                  }
                  return fixer.replaceTextRange(
                    targetRange,
                    !details.errorTarget ? dependencyValue.toString() : JSON.stringify(fixTo)
                  );
                })
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
  dependencies: ["devDependencies", "dependencies"]
};
const directDuplicateDependenciesRule = createPackageRule(
  "direct-duplicate-dependencies",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForMappingSchema
    },
    additionalProperties: false
  },
  {
    checkDependencyValue: ({
      node,
      pkg,
      reportError,
      settings,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForMappingCheck
    }) => {
      if (node.fieldName === "resolutionsExplained") {
        return;
      }
      const searchIn = duplicatesSearchInByDependencyType$1[node.fieldName];
      if (!searchIn) {
        return;
      }
      const [depPkg] = getDependencyPackageJson(node.name);
      checkDuplicateDependencies(
        reportError,
        pkg,
        settings.isLibrary ?? false,
        "dependencies",
        searchIn,
        depPkg,
        onlyWarnsForMappingCheck.createFor(node.name)
      );
    }
  }
);

function fromDependency(depPkg, depType) {
  return `from "${depPkg.name || ""}"${depType ? ` in "${depType}"` : ""}`;
}

semverUtils.parse;
semverUtils.parseRange;
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

const directPeerDependenciesRule = createPackageRule(
  "direct-peer-dependencies",
  {
    type: "object",
    properties: {
      onlyWarnsFor: onlyWarnsForMappingSchema,
      onlyWarnsForMissing: onlyWarnsForMappingSchema
    },
    additionalProperties: false
  },
  {
    checkPackage: ({
      pkg,
      reportError,
      settings,
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
        settings.isLibrary ?? false,
        pkg,
        getDependencyPackageJson,
        missingOnlyWarnsForCheck,
        invalidOnlyWarnsForCheck
      );
      checkOnlyWarnsForMapping(missingOnlyWarnsForCheck);
    }
  }
);

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

const exactVersionsRule = createPackageRule(
  "exact-versions",
  {
    type: "object",
    properties: {
      dependencies: { type: "boolean", default: true },
      devDependencies: { type: "boolean", default: true },
      resolutions: { type: "boolean", default: true },
      onlyWarnsFor: onlyWarnsForArraySchema
    },
    additionalProperties: false
  },
  {
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      if ([
        ruleOptions.dependencies && "dependencies",
        ruleOptions.devDependencies && "devDependencies",
        ruleOptions.resolutions && "resolutions"
      ].filter(Boolean).includes(node.fieldName)) {
        checkExactVersion(reportError, node, {
          getDependencyPackageJson,
          onlyWarnsForCheck
        });
      }
    }
  }
);

function checkDependencyMinRangeSatisfies(reportError, dependencyValue, pkg, dependencyType2) {
  if (!pkg[dependencyType2]) return;
  if (!dependencyValue || dependencyValue.value === "*") return;
  const depRange2 = pkg[dependencyType2][dependencyValue.name];
  if (!depRange2) return;
  const minDepRange1 = semver.minVersion(dependencyValue.value)?.version || dependencyValue.value;
  if (!semver.satisfies(minDepRange1, depRange2.value, {
    includePrerelease: true
  })) {
    const depRange1Parsed = semverUtils.parseRange(dependencyValue.value);
    reportError({
      errorMessage: `Invalid "${dependencyValue.value}" in "${dependencyValue.fieldName}"`,
      errorDetails: `"${dependencyValue.value}" should satisfies "${depRange2.value}" from "${dependencyType2}"`,
      dependency: dependencyValue,
      autoFixable: true,
      errorTarget: "dependencyValue",
      fixTo: (depRange1Parsed[0]?.operator || "") + (semver.minVersion(depRange2.value)?.version || depRange2.value)
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

const resolutionsHasExplanationRule = createPackageRule(
  "resolutions-has-explanation",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    checkDependencyValue: ({ node, reportError, pkg }) => {
      if (node.fieldName === "resolutions") {
        checkResolutionHasExplanation(reportError, node, pkg);
      } else if (node.fieldName === "resolutionsExplained") {
        checkResolutionExplanation(reportError, node, pkg);
      }
    }
  }
);

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

const resolutionsVersionsMatchRule = createPackageRule(
  "resolutions-versions-match",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (node.fieldName === "resolutions") {
        checkResolutionVersionMatch(reportError, pkg, node);
      }
    }
  }
);

const rootWorkspaceShouldNotHaveDependenciesRule = createPackageRule(
  "root-workspace-should-not-have-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    checkDependencyValue: ({ node, pkg, reportError }) => {
      if (!pkg.value.workspaces) {
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

const satisfiesVersionsRule = createPackageRule(
  "satisfies-versions",
  {
    type: "object",
    properties: {
      dependencies: {
        type: "object",
        additionalProperties: { type: "string" }
      },
      devDependencies: {
        type: "object",
        additionalProperties: { type: "string" }
      },
      optionalDependencies: {
        type: "object",
        additionalProperties: { type: "string" }
      },
      onlyWarnsFor: { type: "array", items: { type: "string" } }
    },
    additionalProperties: false
  },
  {
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
        const range = ruleOptions[fieldName][node.name];
        if (!range) {
          throw new Error(
            `Range is undefined for ${node.name} in ${node.fieldName}`
          );
        }
        checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
      }
    }
  }
);

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
            }
          },
          required: ["name", "from", "to"],
          additionalProperties: false
        },
        additionalProperties: false
      },
      required: ["dependencies"]
    },
    additionalProperties: false
  },
  {
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      ruleOptions.dependencies.forEach(({ from }) => {
        checkMissingSatisfiesVersions(
          reportError,
          pkg,
          regularDependencyTypes,
          {
            [typeof from === "string" ? from : from.name]: "*"
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
      if (!regularDependencyTypes.includes(node.fieldName)) {
        return;
      }
      ruleOptions.dependencies.forEach(({ name, from, to }) => {
        const [fromDepName, fromDepIn] = typeof from === "string" ? [from, "dependencies"] : [from.name, from.in ?? "dependencies"];
        if (fromDepName === node.name) {
          const [fromDepPkg] = getDependencyPackageJson(fromDepName);
          const fromDepRange = fromDepPkg[fromDepIn]?.[name];
          if (!fromDepRange) {
            throw new Error(
              `Dependency "${fromDepName}" has no dependency "${name}" in "${fromDepIn}".`
            );
          }
          const [toDepName, toDepIn] = typeof to === "string" ? [to, "dependencies"] : [to.name, to.in ?? "dependencies"];
          const [toDepPkg] = getDependencyPackageJson(toDepName);
          const toDepRange = toDepPkg[toDepIn]?.[name];
          if (!toDepRange) {
            throw new Error(
              `Dependency "${toDepName}" has no dependency "${name}" in "${toDepIn}".`
            );
          }
          if (!isVersionSatisfiesRange(fromDepRange, toDepRange)) {
            reportError({
              errorMessage: `Version not satisfied between dependencies for dependency "${name}"`,
              errorDetails: `"${fromDepRange}" from "${fromDepName}" ${fromDepIn} should satisfies "${toDepRange}" from "${toDepName}" ${toDepIn}`,
              onlyWarns: onlyWarnsForCheck.shouldWarnsFor(node.name)
            });
          }
        }
      });
    }
  }
);

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
              }
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
    checkPackage: ({
      pkg,
      reportError,
      ruleOptions,
      getDependencyPackageJson,
      onlyWarnsForCheck
    }) => {
      if (!ruleOptions.dependencies) {
        throw new Error(
          'Rule "check-package-dependencies/satisfies-versions-from-dependencies" is enabled but no dependencies are configured to check'
        );
      }
      Object.entries(ruleOptions.dependencies).forEach(
        ([depName, values]) => {
          const [depPkg] = getDependencyPackageJson(depName);
          regularDependencyTypes.forEach((type) => {
            if (values[type]) {
              const dependenciesRanges = Object.fromEntries(
                values[type].map((v) => {
                  const range = depPkg.dependencies?.[v];
                  if (!range) {
                    throw new Error(
                      `Dependency ${depName} has no dependency ${v} in ${type}`
                    );
                  }
                  return [v, range];
                })
              );
              checkMissingSatisfiesVersions(
                reportError,
                pkg,
                type,
                dependenciesRanges,
                onlyWarnsForCheck
              );
            }
          });
        }
      );
    },
    checkDependencyValue: ({
      node,
      reportError,
      ruleOptions,
      onlyWarnsForCheck,
      getDependencyPackageJson
    }) => {
      if (!regularDependencyTypes.includes(node.fieldName)) {
        return;
      }
      const fieldName = node.fieldName;
      getEntries(ruleOptions.dependencies).forEach(([depName, values]) => {
        if (values[fieldName]?.includes(node.name)) {
          const [depPkg] = getDependencyPackageJson(depName);
          const range = depPkg.dependencies?.[node.name];
          if (!range) {
            throw new Error(
              `Dependency "${depName}" has no dependency "${fieldName}"`
            );
          }
          checkSatisfiesVersion(reportError, node, range, onlyWarnsForCheck);
        }
      });
    }
  }
);

const duplicatesSearchInByDependencyType = {
  devDependencies: ["devDependencies", "dependencies"],
  dependencies: ["devDependencies", "dependencies"],
  peerDependencies: ["peerDependencies"]
};
const checkDuplicateInAllDependencies = (reportError, basePkg, subPkg, isPkgLibrary, onlyWarnsForCheck) => {
  ["devDependencies", "dependencies"].forEach((depType) => {
    const dependencies = basePkg[depType];
    if (!dependencies || !duplicatesSearchInByDependencyType[depType]) return;
    checkDuplicateDependencies(
      ({ dependency, errorMessage, ...otherDetails }) => {
        reportError({
          ...otherDetails,
          errorMessage: `${subPkg.name}: ${errorMessage}`
        });
      },
      subPkg,
      isPkgLibrary,
      depType,
      duplicatesSearchInByDependencyType[depType],
      basePkg.value,
      onlyWarnsForCheck
    );
  });
};
const workspaceDependenciesRule = createPackageRule(
  "workspace-dependencies",
  {
    type: "object",
    properties: {},
    additionalProperties: false
  },
  {
    checkPackage: ({
      pkg,
      settings,
      reportError,
      loadWorkspacePackageJsons,
      getDependencyPackageJson,
      onlyWarnsForMappingCheck
    }) => {
      if (!pkg.value.workspaces) {
        return;
      }
      const workspacePackageJsons = loadWorkspacePackageJsons();
      const previousCheckedWorkspaces = [];
      for (const subPkg of workspacePackageJsons) {
        const onlyWarnsForCheck = onlyWarnsForMappingCheck.createFor(
          subPkg.name
        );
        checkDuplicateInAllDependencies(
          reportError,
          pkg,
          subPkg,
          settings.isLibrary ?? false,
          onlyWarnsForCheck
        );
        previousCheckedWorkspaces.forEach((previousSubPkg) => {
          checkDuplicateInAllDependencies(
            reportError,
            previousSubPkg,
            subPkg,
            settings.isLibrary ?? false,
            onlyWarnsForCheck
          );
        });
        previousCheckedWorkspaces.push(subPkg);
        const allDepPkgs = [];
        regularDependencyTypes.forEach((depType) => {
          const dependencies = subPkg[depType];
          if (!dependencies) return;
          for (const depName of getKeys(dependencies)) {
            const [depPkg] = getDependencyPackageJson(depName);
            if (pkg.devDependencies?.[depName]) {
              continue;
            }
            allDepPkgs.push({ name: depName, type: depType, pkg: depPkg });
          }
        });
        for (const {
          name: depName,
          type: depType,
          pkg: depPkg
        } of allDepPkgs) {
          if (depPkg.peerDependencies) {
            for (const [peerDepName, range] of Object.entries(
              depPkg.peerDependencies
            )) {
              if (subPkg.devDependencies?.[peerDepName]) {
                continue;
              }
              checkSatisfiesPeerDependency(
                reportError,
                pkg,
                depType,
                ["devDependencies"],
                peerDepName,
                range,
                depPkg,
                onlyWarnsForMappingCheck.createFor(
                  `${depName}:peedDepdencies:invalid`
                )
              );
            }
          }
        }
      }
    }
  }
);

const rules = {
  ...directPeerDependenciesRule,
  ...directDuplicateDependenciesRule,
  ...exactVersionsRule,
  ...minRangeDependenciesSatisfiesDevDependenciesRule,
  ...minRangePeerDependenciesSatisfiesDependenciesRule,
  ...resolutionsVersionsMatchRule,
  ...satisfiesVersionsRule,
  ...resolutionsHasExplanationRule,
  ...rootWorkspaceShouldNotHaveDependenciesRule,
  ...satisfiesVersionsFromDependenciesRule,
  ...satisfiesVersionsBetweenDependenciesRule,
  ...workspaceDependenciesRule
};

const checkPackagePlugin = {
  languages: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    "package-json": PackageJSONLanguage
  },
  rules: {
    ...rules
  },
  configs: {
    base: {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {}
    },
    recommended: {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      rules: {
        "check-package-dependencies/exact-versions": "error",
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/direct-peer-dependencies": "error",
        "check-package-dependencies/direct-duplicate-dependencies": "error",
        "check-package-dependencies/resolutions-has-explanation": "error",
        "check-package-dependencies/root-workspace-should-not-have-dependencies": "error",
        "check-package-dependencies/workspace-dependencies": "error"
      }
    },
    "recommended-library": {
      files: ["**/package.json"],
      language: "check-package-dependencies/package-json",
      plugins: {},
      settings: {
        "check-package-dependencies": {
          isLibrary: true
        }
      },
      rules: {
        "check-package-dependencies/exact-versions": [
          "error",
          { dependencies: false }
        ],
        "check-package-dependencies/resolutions-versions-match": "error",
        "check-package-dependencies/direct-peer-dependencies": "error",
        "check-package-dependencies/direct-duplicate-dependencies": "error",
        "check-package-dependencies/resolutions-has-explanation": "error",
        "check-package-dependencies/min-range-dependencies-satisfies-dev-dependencies": "error",
        "check-package-dependencies/min-range-peer-dependencies-satisfies-dependencies": "error",
        "check-package-dependencies/root-workspace-should-not-have-dependencies": "error",
        "check-package-dependencies/workspace-dependencies": "error"
      }
    }
  }
};
checkPackagePlugin.configs.base.plugins = {
  "check-package-dependencies": checkPackagePlugin
};
checkPackagePlugin.configs.recommended.plugins = {
  "check-package-dependencies": checkPackagePlugin
};
checkPackagePlugin.configs["recommended-library"].plugins = {
  "check-package-dependencies": checkPackagePlugin
};

export { checkPackagePlugin as default };
//# sourceMappingURL=eslint-plugin-node.mjs.map
