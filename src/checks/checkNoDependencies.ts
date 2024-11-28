import { createReportError } from "../utils/createReportError";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes";

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
  reportError(
    `Unexpected ${type}`,
    `you should move them in ${moveToSuggestion}`,
  );
}
