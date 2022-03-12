import semver from 'semver';
import type { ReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import type { OnlyWarnsForCheck } from '../utils/warnForUtils';

export function checkPeerDependencies(
  pkg: PackageJson,
  reportError: ReportError,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  depPkg: PackageJson,
  missingOnlyWarnsForCheck: OnlyWarnsForCheck,
  invalidOnlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const { peerDependencies, peerDependenciesMeta } = depPkg;
  if (!peerDependencies) return;

  const allowedPeerInExisting = allowedPeerIn.filter(
    (allowedPeerInType) => pkg[allowedPeerInType],
  );

  for (const [peerDepKey, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(
      (allowedPeerInExistingType) =>
        pkg[allowedPeerInExistingType]![peerDepKey],
    );
    if (versionsIn.length === 0) {
      const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepKey];
      if (peerDependenciesMetaPeerDep?.optional) {
        return;
      }
      reportError(
        `Missing "${peerDepKey}" peer dependency from "${depPkg.name}" in ${type}`,
        `it should satisfies "${range}" and be in ${allowedPeerIn.join(
          ' or ',
        )}`,
        missingOnlyWarnsForCheck.shouldWarnsFor(peerDepKey),
      );
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType]![peerDepKey],
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
            `Invalid "${peerDepKey}" peer dependency`,
            `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`,
            invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepKey),
          );
        }
      });
    }
  }
}
