import semver from 'semver';
import semverUtils from 'semver-utils';
import type { PackageJson } from 'type-fest';
import { createReportError } from '../utils/createReportError';
import { getEntries } from '../utils/object';
import type { DependencyTypes } from '../utils/packageTypes';

export interface CheckMinRangeSatisfiesOptions {
  customCreateReportError?: typeof createReportError;
  tryToAutoFix?: boolean;
}

export function checkMinRangeSatisfies(
  pkgPathName: string,
  pkg: PackageJson,
  type1: DependencyTypes = 'dependencies',
  type2: DependencyTypes = 'devDependencies',
  {
    tryToAutoFix = false,
    customCreateReportError = createReportError,
  }: CheckMinRangeSatisfiesOptions = {},
): void {
  const dependencies1 = pkg[type1];
  const dependencies2 = pkg[type2];

  if (!dependencies1 || !dependencies2) {
    return;
  }

  const reportError = customCreateReportError(
    `"${type1}" minimum range satisfies "${type2}"`,
    pkgPathName,
  );

  for (const [depName, depRange1] of getEntries(dependencies1)) {
    if (depRange1 === '*') continue;

    const depRange2 = dependencies2[depName];
    if (!depRange2 || !depRange1) continue;

    const minDepRange1 = semver.minVersion(depRange1)?.version || depRange1;

    if (
      !semver.satisfies(minDepRange1, depRange2, {
        includePrerelease: true,
      })
    ) {
      if (tryToAutoFix) {
        const depRange1Parsed = semverUtils.parseRange(depRange1);
        dependencies1[depName] =
          (depRange1Parsed[0]?.operator || '') +
          (semver.minVersion(depRange2)?.version || depRange2);
      } else {
        reportError(
          `Invalid "${depName}" in ${type1}`,
          `"${depRange1}" should satisfies "${depRange2}" from "${type2}".`,
          false,
          true,
        );
      }
    }
  }
}
