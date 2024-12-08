import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { createReportError } from "../utils/createReportError.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";

export type CheckResolutionMessage = (
  depKey: string,
  resolutionExplainedMessage: string,
  checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
  },
) => string | undefined;

export function checkResolutionsHasExplanation(
  pkg: ParsedPackageJson,
  checkMessage: CheckResolutionMessage,
  getDependencyPackageJson: GetDependencyPackageJson,
  customCreateReportError = createReportError,
): void {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  const reportError = customCreateReportError(
    "Resolutions has explanation",
    pkg.path,
  );

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
