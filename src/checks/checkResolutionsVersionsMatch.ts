import semver from 'semver';
import { createReportError } from '../utils/createReportError';
import type { PackageJson } from '../utils/packageTypes';

export interface CheckResolutionsVersionsMatchOptions {
  tryToAutoFix?: boolean;
}

export function checkResolutionsVersionsMatch(
  pkg: PackageJson,
  pkgPathName: string,
  { tryToAutoFix }: CheckResolutionsVersionsMatchOptions = {},
): void {
  const pkgResolutions = pkg.resolutions || {};
  const reportError = createReportError(
    'Resolutions match other dependencies',
    pkgPathName,
  );

  Object.entries(pkgResolutions).forEach(([depName, resolutionDepVersion]) => {
    (['dependencies', 'devDependencies'] as const).forEach((depType) => {
      const range = pkg?.[depType]?.[depName];

      if (!range) return;

      if (
        !semver.satisfies(resolutionDepVersion, range, {
          includePrerelease: true,
        })
      ) {
        if (tryToAutoFix) {
          pkg[depType]![depName] = resolutionDepVersion;
        } else {
          reportError(
            `Invalid "${depName}" in ${depType}`,
            `expecting "${range}" be "${resolutionDepVersion}" from resolutions.`,
          );
        }
      }
    });
  });
}
