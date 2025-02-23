import type { ReportError } from "../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
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

export type CheckResolutionMessage = (
  depKey: string,
  resolutionExplainedMessage: string,
  checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
  },
) => string | undefined;

export function checkResolutionsHasExplanation(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  checkMessage: CheckResolutionMessage,
  getDependencyPackageJson: GetDependencyPackageJson,
): void {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  Object.keys(pkgResolutions).forEach((depKey) => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError({
        errorMessage: `Missing "${depKey}" in resolutionsExplained`,
      });
    }
  });

  Object.entries(pkgResolutionsExplained).forEach(([depKey, depValue]) => {
    if (!depValue) return;
    if (!pkgResolutions[depKey]) {
      reportError({
        errorMessage: `Found "${depKey}" in resolutionsExplained but not in resolutions`,
      });
    } else {
      const error = checkMessage(depKey, depValue.value, {
        getDependencyPackageJson,
      });
      if (error) {
        reportError({
          errorMessage: "Invalid message",
          dependency: pkgResolutionsExplained[depKey],
          errorDetails: error,
        });
      }
    }
  });
}
