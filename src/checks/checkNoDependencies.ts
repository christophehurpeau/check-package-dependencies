import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";

export function checkNoDependencies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type: DependencyTypes = "dependencies",
  moveToSuggestion: DependencyTypes = "devDependencies",
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  reportError({
    errorMessage: `Unexpected ${type}`,
    errorDetails: `you should move them in ${moveToSuggestion}`,
    autoFixable: false,
  });
}
