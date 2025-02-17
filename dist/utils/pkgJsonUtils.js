import { readFileSync, writeFileSync } from "node:fs";
// eslint-disable-next-line n/no-unsupported-features/node-builtins
import { findPackageJSON } from "node:module";
import { findNodeAtLocation, getNodeValue, parseTree } from "jsonc-parser";
if (typeof findPackageJSON !== "function") {
    // eslint-disable-next-line unicorn/prefer-type-error
    throw new Error("check-package-dependencies requires node >= 22.14.0");
}
export function readPkgJson(packagePath) {
    return JSON.parse(readFileSync(packagePath, "utf8"));
}
export function stringifyPkgJson(pkg) {
    return `${JSON.stringify(pkg, null, 2)}\n`;
}
export function writePkgJson(packagePath, pkg) {
    writeFileSync(packagePath, stringifyPkgJson(pkg));
}
function getLocationFromOffset(packageContent, offset) {
    if (offset < 0 || offset > packageContent.length) {
        throw new Error(`Offset ${offset} is out of bounds (0 to ${packageContent.length})`);
    }
    const lines = packageContent.slice(0, offset).split("\n");
    const lastLine = lines.at(-1);
    return { line: lines.length, column: lastLine ? lastLine.length + 1 : 1 };
}
function validateJsonParsing(json, errors, packagePath) {
    if (errors.length > 0) {
        throw new Error(`Failed to parse JSON at ${packagePath}: ${errors.map(String).join(", ")}`);
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
        throw new TypeError(`Invalid package.json at ${packagePath}: "name" field is not a string`);
    }
}
const dependencyFieldNames = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "resolutions",
    "resolutionsExplained",
];
function parseDependencyField(json, fieldName, packageContent, packageValue) {
    const fieldNode = findNodeAtLocation(json, [fieldName]);
    if (!fieldNode?.children) {
        return [fieldName, undefined];
    }
    const dependencies = Object.fromEntries(fieldNode.children
        .filter((child) => child.type === "property")
        .map((propertyNode) => {
        const nameNode = propertyNode.children[0];
        const valueNode = propertyNode.children[1];
        const name = getNodeValue(nameNode);
        const value = getNodeValue(valueNode);
        const startLocation = getLocationFromOffset(packageContent, propertyNode.offset);
        const valueStartLocation = getLocationFromOffset(packageContent, valueNode.offset);
        const parsedDependency = {
            fieldName,
            name,
            value,
            locations: {
                all: {
                    start: startLocation,
                    end: {
                        line: startLocation.line,
                        column: startLocation.column + propertyNode.length,
                    },
                },
                name: {
                    start: startLocation,
                    end: {
                        line: startLocation.line,
                        column: startLocation.column + nameNode.length,
                    },
                },
                value: {
                    start: valueStartLocation,
                    end: {
                        line: valueStartLocation.line,
                        column: valueStartLocation.column + valueNode.length,
                    },
                },
            },
            ranges: {
                all: [propertyNode.offset, valueNode.offset + valueNode.length],
                name: [propertyNode.offset, nameNode.offset + nameNode.length],
                value: [valueNode.offset, valueNode.offset + valueNode.length],
            },
            changeValue(newValue) {
                packageValue[fieldName][name] = newValue;
                parsedDependency.value = newValue;
            },
            toString() {
                return `${JSON.stringify(parsedDependency.name)}: ${JSON.stringify(parsedDependency.value)}`;
            },
        };
        return [name, parsedDependency];
    }));
    return [fieldName, dependencies];
}
export function parsePkg(packageContent, packagePath) {
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
        ...Object.fromEntries(dependencyFieldNames.map((fieldName) => parseDependencyField(json, fieldName, packageContent, value))),
        change(type, dependencyName, newValue) {
            const dependency = this[type]?.[dependencyName];
            if (dependency) {
                dependency.changeValue(newValue);
            }
            else {
                value[type] = { ...value[type], [dependencyName]: newValue };
            }
        },
    };
}
// mainly for testing
export function parsePkgValue(pkg, packagePath = "unknown_path") {
    return parsePkg(JSON.stringify(pkg), packagePath);
}
export function readAndParsePkgJson(packagePath) {
    return parsePkg(readFileSync(packagePath, "utf8"), packagePath);
}
/** @internal */
export function internalLoadPackageJsonFromNodeModules(pkgDepName, pkgDirname) {
    const packagePath = findPackageJSON(pkgDepName, `file://${pkgDirname}/package.json`);
    if (!packagePath) {
        throw new Error(`Package ${pkgDepName} not found in ${pkgDirname}`);
    }
    return [packagePath, readPkgJson(packagePath)];
}
//# sourceMappingURL=pkgJsonUtils.js.map