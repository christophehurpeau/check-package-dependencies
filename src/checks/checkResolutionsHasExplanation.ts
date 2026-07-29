import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";

export function checkResolutionHasExplanation(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  pkg: ParsedPackageJson,
): void {
  if (!pkg.resolutionsExplained?.[dependencyValue.name]) {
    reportError({
      errorMessage: `Missing "${dependencyValue.name}" in "resolutionsExplained"`,
      dependency: dependencyValue,
    });
  }
}

export function checkResolutionExplanation(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  pkg: ParsedPackageJson,
): void {
  if (!pkg.resolutions?.[dependencyValue.name]) {
    reportError({
      errorMessage: `Found "${dependencyValue.name}" in "resolutionsExplained" but not in "resolutions"`,
      dependency: dependencyValue,
    });
  }
}
