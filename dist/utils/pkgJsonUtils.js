import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve as importResolve } from "import-meta-resolve";
import { findNodeAtLocation, getNodeValue, parseTree } from "jsonc-parser";
export function readPkgJson(packagePath) {
    return JSON.parse(readFileSync(packagePath, "utf8"));
}
export function writePkgJson(packagePath, pkg) {
    writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
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
        const dependencyName = getNodeValue(propertyNode.children[0]);
        const versionValue = getNodeValue(propertyNode.children[1]);
        const location = getLocationFromOffset(packageContent, propertyNode.offset);
        const parsedDependency = {
            fieldName,
            name: dependencyName,
            value: versionValue,
            line: location.line,
            column: location.column,
            changeValue(newValue) {
                packageValue[fieldName][dependencyName] = newValue;
                parsedDependency.value = newValue;
            },
        };
        return [dependencyName, parsedDependency];
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
    const packageUrl = importResolve(`${pkgDepName}/package.json`, `file://${pkgDirname}/package.json`);
    const packagePath = fileURLToPath(packageUrl);
    return [packagePath, readPkgJson(packagePath)];
}
//# sourceMappingURL=pkgJsonUtils.js.map