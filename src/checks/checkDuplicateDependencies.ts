import semver from 'semver';
import type { ReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

export function checkDuplicateDependencies(
  reportError: ReportError,
  pkg: PackageJson,
  depType: DependencyTypes,
  searchIn: DependencyTypes[],
  depPkg: PackageJson,
  onlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const dependencies = depPkg[depType];
  if (!dependencies) return;

  const searchInExisting = searchIn.filter((type) => pkg[type]);

  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter((type) => pkg[type]![depKey]);

    if (versionsIn.length > 1) {
      reportError(
        `${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`,
      );
    } else {
      const versions = versionsIn.map((type) => pkg[type]![depKey]);

      versions.forEach((version, index) => {
        if (version.startsWith('file:') || range.startsWith('file:')) return;
        // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
        if (
          version.startsWith('workspace:') ||
          range.startsWith('workspace:')
        ) {
          return;
        }

        if (
          semver.satisfies(version, range, {
            includePrerelease: true,
          }) ||
          semver.intersects(version, range, {
            includePrerelease: true,
          })
        ) {
          return;
        }

        // Ignore reporting duplicate when there's a resolution for it
        if (pkg.resolutions?.[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];

        reportError(
          `Invalid duplicate dependency "${depKey}"`,
          `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`,
          onlyWarnsForCheck.shouldWarnsFor(depKey),
        );
      });
    }
  }
}
