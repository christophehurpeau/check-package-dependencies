import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';

export function checkIdenticalVersionsThanDependency(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  dependencies: PackageJson[DependencyTypes] = {},
  onlyWarnsFor: string[] = [],
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = createReportError(
    `Same Versions than ${depPkg.name}`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    if (!version) {
      reportError(
        `Unexpected missing dependency "${depKey}" in "${depPkg.name}".`,
      );
      return;
    }

    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(
        `Unexpected range dependency in "${depPkg.name}" for "${depKey}"`,
        'perhaps use checkSatisfiesVersionsFromDependency() instead.',
      );
      return;
    }

    const value = pkgDependencies[depKey];

    if (!value) {
      reportError(
        `Missing "${depKey}" in ${type}`,
        `expecting to be "${version}".`,
        onlyWarnsFor.includes(depKey),
      );
    }

    if (value !== version) {
      reportError(
        `Invalid "${depKey}" in ${type}`,
        `expecting "${value}" to be "${version}".`,
        onlyWarnsFor.includes(depKey),
      );
    }
  });
}
