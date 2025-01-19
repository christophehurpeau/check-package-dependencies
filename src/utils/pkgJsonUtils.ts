import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve as importResolve } from "import-meta-resolve";
import type { ParseError } from "jsonc-parser";
import { findNodeAtLocation, getNodeValue, parseTree } from "jsonc-parser";
import type {
  DependencyValue,
  PackageJson,
  ParsedPackageJson,
} from "./packageTypes.ts";

export function readPkgJson(packagePath: string): PackageJson {
  return JSON.parse(readFileSync(packagePath, "utf8")) as PackageJson;
}

export function stringifyPkgJson(pkg: PackageJson): string {
  return `${JSON.stringify(pkg, null, 2)}\n`;
}

export function writePkgJson(packagePath: string, pkg: PackageJson): void {
  writeFileSync(packagePath, stringifyPkgJson(pkg));
}

function getLocationFromOffset(
  packageContent: string,
  offset: number,
): { line: number; column: number } {
  if (offset < 0 || offset > packageContent.length) {
    throw new Error(
      `Offset ${offset} is out of bounds (0 to ${packageContent.length})`,
    );
  }

  const lines = packageContent.slice(0, offset).split("\n");
  const lastLine = lines.at(-1);
  return { line: lines.length, column: lastLine ? lastLine.length + 1 : 1 };
}

function validateJsonParsing(
  json: ReturnType<typeof parseTree>,
  errors: ParseError[],
  packagePath: string,
): asserts json is NonNullable<typeof json> {
  if (errors.length > 0) {
    throw new Error(
      `Failed to parse JSON at ${packagePath}: ${errors.map(String).join(", ")}`,
    );
  }
  if (!json) {
    throw new Error(`Failed to parse JSON at ${packagePath}: empty JSON`);
  }
}

function validatePackageName(
  nameNode: ReturnType<typeof findNodeAtLocation>,
  packagePath: string,
): asserts nameNode is NonNullable<typeof nameNode> {
  if (!nameNode) {
    throw new Error(`Invalid package.json at ${packagePath}: no "name" field`);
  }
  if (typeof nameNode.value !== "string") {
    throw new TypeError(
      `Invalid package.json at ${packagePath}: "name" field is not a string`,
    );
  }
}

const dependencyFieldNames = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "resolutions",
  "resolutionsExplained",
] as const;

function parseDependencyField(
  json: NonNullable<ReturnType<typeof parseTree>>,
  fieldName: (typeof dependencyFieldNames)[number],
  packageContent: string,
  packageValue: PackageJson,
): [string, Record<string, DependencyValue> | undefined] {
  const fieldNode = findNodeAtLocation(json, [fieldName]);
  if (!fieldNode?.children) {
    return [fieldName, undefined];
  }

  const dependencies = Object.fromEntries<DependencyValue>(
    fieldNode.children
      .filter((child) => child.type === "property")
      .map((propertyNode) => {
        const dependencyNameNode = propertyNode.children![0];
        const dependencyValueNode = propertyNode.children![1];

        const dependencyName = getNodeValue(dependencyNameNode) as string;
        const versionValue = getNodeValue(dependencyValueNode) as string;
        const startLocation = getLocationFromOffset(
          packageContent,
          propertyNode.offset,
        );
        const valueStartLocation = getLocationFromOffset(
          packageContent,
          dependencyValueNode.offset,
        );

        const parsedDependency = {
          fieldName,
          name: dependencyName,
          value: versionValue,
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
                column: startLocation.column + dependencyNameNode.length,
              },
            },
            value: {
              start: valueStartLocation,
              end: {
                line: valueStartLocation.line,
                column: valueStartLocation.column + dependencyValueNode.length,
              },
            },
          },
          changeValue(newValue: string) {
            packageValue[fieldName]![dependencyName] = newValue;
            parsedDependency.value = newValue;
          },
        };

        return [dependencyName, parsedDependency];
      }),
  );

  return [fieldName, dependencies];
}

export function parsePkg(
  packageContent: string,
  packagePath: string,
): ParsedPackageJson {
  const errors: ParseError[] = [];
  const json = parseTree(packageContent, errors, { disallowComments: true });
  validateJsonParsing(json, errors, packagePath);

  const nameNode = findNodeAtLocation(json, ["name"]);
  validatePackageName(nameNode, packagePath);

  const value = getNodeValue(json) as PackageJson;

  return {
    name: getNodeValue(nameNode) as string,
    path: packagePath,
    value,
    ...Object.fromEntries(
      dependencyFieldNames.map((fieldName) =>
        parseDependencyField(json, fieldName, packageContent, value),
      ),
    ),
    change(type, dependencyName, newValue) {
      const dependency = this[type]?.[dependencyName];
      if (dependency) {
        dependency.changeValue(newValue);
      } else {
        value[type] = { ...value[type], [dependencyName]: newValue };
      }
    },
  };
}

// mainly for testing
export function parsePkgValue(
  pkg: unknown,
  packagePath = "unknown_path",
): ParsedPackageJson {
  return parsePkg(JSON.stringify(pkg), packagePath);
}

export function readAndParsePkgJson(packagePath: string): ParsedPackageJson {
  return parsePkg(readFileSync(packagePath, "utf8"), packagePath);
}

/** @internal */
export function internalLoadPackageJsonFromNodeModules(
  pkgDepName: string,
  pkgDirname: string,
): [path: string, pkg: PackageJson] {
  const packageUrl = importResolve(
    `${pkgDepName}/package.json`,
    `file://${pkgDirname}/package.json`,
  );
  const packagePath = fileURLToPath(packageUrl);
  return [packagePath, readPkgJson(packagePath)];
}
