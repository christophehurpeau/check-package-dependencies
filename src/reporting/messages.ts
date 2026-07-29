import type { PackageJson } from "type-fest";
import type { DependencyTypes } from "../utils/packageTypes.ts";

export function fromDependency(
  depPkg: PackageJson,
  depType?: DependencyTypes,
): string {
  return `from "${depPkg.name || ""}"${depType ? ` in "${depType}"` : ""}`;
}

export function inDependency(
  depPkg: PackageJson,
  depType?: DependencyTypes,
): string {
  return `in ${depType ? `"${depType}" of ` : ""}"${depPkg.name || ""}"`;
}
