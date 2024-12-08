import { createReportError } from "../utils/createReportError.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";

export function checkNoDependencies(
  pkg: ParsedPackageJson,
  type: DependencyTypes = "dependencies",
  moveToSuggestion: DependencyTypes = "devDependencies",
  customCreateReportError = createReportError,
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = customCreateReportError("No dependencies", pkg.path);
  reportError({
    errorMessage: `Unexpected ${type}`,
    errorDetails: `you should move them in ${moveToSuggestion}`,
    autoFixable: false,
  });
}
