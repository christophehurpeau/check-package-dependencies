import semver from 'semver';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';
import { shouldOnlyWarnFor } from '../utils/shouldOnlyWarnFor';

export function checkPeerDependencies(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  depPkg: PackageJson,
  onlyWarnsFor: string[] = [],
): void {
  const { peerDependencies, peerDependenciesMeta } = depPkg;
  if (!peerDependencies) return;
  const reportError = createReportError('Peer Dependencies', pkgPathName);

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
        shouldOnlyWarnFor(peerDepKey, onlyWarnsFor),
      );
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType]![peerDepKey],
      );

      versions.forEach((version, index) => {
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
            shouldOnlyWarnFor(peerDepKey, onlyWarnsFor),
          );
        }
      });
    }
  }
}
