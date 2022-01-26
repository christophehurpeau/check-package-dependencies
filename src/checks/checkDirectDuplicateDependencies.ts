import semver from 'semver';
import type { ReportError } from '../utils/createReportError';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import { shouldOnlyWarnFor } from '../utils/shouldOnlyWarnFor';

export function checkWarnedFor(
  reportError: ReportError,
  warnedFor: Set<string>,
  onlyWarnsFor: string[] = [],
): void {
  onlyWarnsFor.forEach((depName) => {
    if (!warnedFor.has(depName)) {
      reportError(
        `Invalid "${depName}" in "onlyWarnsFor" but no warning was raised`,
      );
    }
  });
}

export function checkDirectDuplicateDependencies(
  pkg: PackageJson,
  pkgPathName: string,
  depType: DependencyTypes,
  searchIn: DependencyTypes[],
  depPkg: PackageJson,
  onlyWarnsFor: string[] = [],
  warnedForInternal?: Set<string>,
  reportErrorNamePrefix = '',
): void {
  const dependencies = depPkg[depType];
  if (!dependencies) return;

  const warnedFor = warnedForInternal || new Set<string>();

  const reportError = createReportError(
    `${reportErrorNamePrefix}Direct Duplicate Dependencies`,
    pkgPathName,
  );
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
        const shouldOnlyWarn = shouldOnlyWarnFor(depKey, onlyWarnsFor);
        if (shouldOnlyWarn) warnedFor.add(depKey);

        reportError(
          `Invalid duplicate dependency "${depKey}"`,
          `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`,
          shouldOnlyWarn,
        );
      });
    }
  }

  if (!warnedForInternal) {
    checkWarnedFor(reportError, warnedFor, onlyWarnsFor);
  }
}
