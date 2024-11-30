import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";

export function checkNoDependencies(
  pkg: PackageJson,
  pkgPath: string,
  type: DependencyTypes = "dependencies",
  moveToSuggestion: DependencyTypes = "devDependencies",
  customCreateReportError = createReportError,
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = customCreateReportError("No dependencies", pkgPath);
  reportError({
    title: `Unexpected ${type}`,
    info: `you should move them in ${moveToSuggestion}`,
    autoFixable: false,
  });
}
