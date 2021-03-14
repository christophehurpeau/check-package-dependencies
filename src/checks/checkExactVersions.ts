import { createReportError } from './utils/createReportError';
import type { PackageJson, DependencyTypes } from './utils/packageTypes';

export function checkExactVersions(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
): void {
  const pkgDependencies = pkg[type];
  if (!pkgDependencies) return;

  const reportError = createReportError('Exact versions', pkgPathName);

  for (const [depKey, version] of Object.entries(pkgDependencies)) {
    if (version.startsWith('^') || version.startsWith('~')) {
      reportError(
        `Unexpected range dependency in "${type}" for "${depKey}"`,
        `expecting "${version}" to be exact "${version.slice(1)}".`,
      );
      return;
    }
  }
}
