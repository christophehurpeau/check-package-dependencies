import semver from 'semver';
import { createReportError } from '../utils/createReportError';
import type { PackageJson } from '../utils/packageTypes';

export interface CheckResolutionsVersionsMatchOptions {
  tryToAutoFix?: boolean;
  customCreateReportError?: typeof createReportError;
}

export function checkResolutionsVersionsMatch(
  pkg: PackageJson,
  pkgPathName: string,
  {
    tryToAutoFix,
    customCreateReportError = createReportError,
  }: CheckResolutionsVersionsMatchOptions = {},
): void {
  const pkgResolutions = pkg.resolutions || {};
  const reportError = customCreateReportError(
    'Resolutions match other dependencies',
    pkgPathName,
  );

  Object.entries(pkgResolutions).forEach(([resolutionKey, resolutionValue]) => {
    let depName = resolutionKey;
    let resolutionDepVersion = resolutionValue;
    if (resolutionValue.startsWith('patch:')) {
      const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(resolutionKey);
      if (matchResolutionInKey) {
        [, depName, resolutionDepVersion] = matchResolutionInKey;
      }
    }
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
