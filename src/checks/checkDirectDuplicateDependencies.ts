import { intersects } from 'semver';
import type { ReportError } from '../utils/createReportError';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';

export function checkWarnedFor(
  reportError: ReportError,
  onlyWarnsFor: string[] = [],
  warnedFor: Set<string>,
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
): void {
  const dependencies = depPkg[depType];
  if (!dependencies) return;

  const warnedFor = warnedForInternal || new Set<string>();

  const reportError = createReportError(
    'Direct Duplicate Dependencies',
    pkgPathName,
  );
  const searchInExisting = searchIn.filter((type) => pkg[type]);

  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter(
      (type) => (pkg[type] as NonNullable<typeof pkg[DependencyTypes]>)[depKey],
    );

    if (versionsIn.length > 1) {
      reportError(
        `${depKey} is present in both devDependencies and dependencies, please place it only in dependencies`,
      );
    } else {
      const versions = versionsIn.map(
        (type) =>
          (pkg[type] as NonNullable<typeof pkg[DependencyTypes]>)[depKey],
      );

      versions.forEach((version, index) => {
        if (version.startsWith('file:')) return;

        if (intersects(version, range)) {
          return;
        }

        // Ignore reporting duplicate when there's a resolution for it
        if (pkg.resolutions?.[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];
        const shouldWarns = onlyWarnsFor.includes(depKey);
        if (shouldWarns) warnedFor.add(depKey);

        reportError(
          `Invalid duplicate dependency "${depKey}"`,
          `"${versions[0]}" (in ${versionInType}) should satisfies "${range}" from "${depPkg.name}" ${depType}.`,
          shouldWarns,
        );
      });
    }
  }

  if (!warnedForInternal) {
    checkWarnedFor(reportError, onlyWarnsFor, warnedFor);
  }
}
