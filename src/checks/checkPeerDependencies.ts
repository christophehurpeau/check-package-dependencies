import semver from 'semver';
import type { ReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

export function checkPeerDependencies(
  pkg: PackageJson,
  reportError: ReportError,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  providedDependencies: [string, string][],
  depPkg: PackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const { peerDependencies, peerDependenciesMeta } = depPkg;
  if (!peerDependencies) return;

  const allowedPeerInExisting = allowedPeerIn.filter(
    (allowedPeerInType) => pkg[allowedPeerInType],
  );

  for (const [peerDepName, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(
      (allowedPeerInExistingType) =>
        pkg[allowedPeerInExistingType]?.[peerDepName],
    );
    if (versionsIn.length === 0) {
      const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepName];
      if (peerDependenciesMetaPeerDep?.optional) {
        continue;
      }

      // satisfied by another direct dependency
      if (
        providedDependencies.some(
          ([depName, depRange]) =>
            depName === peerDepName && semver.intersects(range, depRange),
        )
      ) {
        continue;
      }

      reportError(
        `Missing "${peerDepName}" peer dependency from "${depPkg.name}" in ${type}`,
        `it should satisfies "${range}" and be in ${allowedPeerIn.join(
          ' or ',
        )}`,
        missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
      );
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType]![peerDepName],
      );

      versions.forEach((version, index) => {
        if (version.startsWith('npm:')) {
          return;
        }

        const minVersionOfVersion = semver.minVersion(version);
        if (
          !minVersionOfVersion ||
          !semver.satisfies(minVersionOfVersion, range, {
            includePrerelease: true,
          })
        ) {
          reportError(
            `Invalid "${peerDepName}" peer dependency`,
            `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`,
            invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
          );
        }
      });
    }
  }
}
