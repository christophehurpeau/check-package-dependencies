import type { GetDependencyPackageJson } from '../utils/createGetDependencyPackageJson';
import { createReportError } from '../utils/createReportError';
import type { PackageJson } from '../utils/packageTypes';

export type CheckResolutionMessage = (
  depKey: string,
  resolutionExplainedMessage: string,
  checkMessageHelpers: {
    getDependencyPackageJson: GetDependencyPackageJson;
  },
) => string | undefined;

export function checkResolutionsHasExplanation(
  pkg: PackageJson,
  pkgPathName: string,
  checkMessage: CheckResolutionMessage,
  getDependencyPackageJson: GetDependencyPackageJson,
  customCreateReportError = createReportError,
): void {
  const pkgResolutions = pkg.resolutions || {};
  const pkgResolutionsExplained = pkg.resolutionsExplained || {};
  const reportError = customCreateReportError(
    'Resolutions has explanation',
    pkgPathName,
  );

  Object.keys(pkgResolutions).forEach((depKey) => {
    if (!pkgResolutionsExplained[depKey]) {
      reportError(`Missing "${depKey}" in resolutionsExplained.`);
    }
  });

  Object.keys(pkgResolutionsExplained).forEach((depKey) => {
    if (!pkgResolutions[depKey]) {
      reportError(
        `Found "${depKey}" in resolutionsExplained but not in resolutions.`,
      );
    } else {
      const error = checkMessage(depKey, pkgResolutionsExplained[depKey], {
        getDependencyPackageJson,
      });
      if (error) {
        reportError(
          `Invalid message for "${depKey}" in resolutionsExplained`,
          `${error}.`,
        );
      }
    }
  });
}
