import type { OnlyWarnsFor } from 'utils/shouldOnlyWarnFor';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import { shouldOnlyWarnFor } from '../utils/shouldOnlyWarnFor';

export interface CheckExactVersionsOptions {
  onlyWarnsFor?: OnlyWarnsFor;
  tryToAutoFix?: boolean;
}

const isVersionRange = (version: string): boolean =>
  version.startsWith('^') || version.startsWith('~');

export function checkExactVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  { onlyWarnsFor = [], tryToAutoFix = false }: CheckExactVersionsOptions = {},
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('Exact versions', pkgPathName);

  for (const [dependencyName, version] of Object.entries(pkgDependencies)) {
    if (isVersionRange(version)) {
      const shouldOnlyWarn = shouldOnlyWarnFor(dependencyName, onlyWarnsFor);
      if (!shouldOnlyWarn && tryToAutoFix) {
        pkgDependencies[dependencyName] = version.slice(1);
      } else {
        reportError(
          `Unexpected range dependency in "${type}" for "${dependencyName}"`,
          `expecting "${version}" to be exact "${version.slice(1)}".`,
          shouldOnlyWarn,
        );
      }
    }
  }
}
