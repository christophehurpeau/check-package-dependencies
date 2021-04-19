import { satisfies, minVersion } from 'semver';
import { createReportError } from '../utils/createReportError';
import type { PackageJson, DependencyTypes } from '../utils/packageTypes';

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

  const allowedPeerInExisting = allowedPeerIn.filter((type) => pkg[type]);

  for (const [peerDepKey, range] of Object.entries(peerDependencies)) {
    const versionsIn = allowedPeerInExisting.filter(
      (type) =>
        (pkg[type] as NonNullable<typeof pkg[DependencyTypes]>)[peerDepKey],
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
        onlyWarnsFor.includes(peerDepKey),
      );
    } else {
      const versions = versionsIn.map(
        (type) =>
          (pkg[type] as NonNullable<typeof pkg[DependencyTypes]>)[peerDepKey],
      );
      if (versions.length > 1) {
        reportError(
          `${peerDepKey} is present in both devDependencies and dependencies`,
          'place it only in dependencies',
        );
        return;
      }

      versions.forEach((version, index) => {
        const minVersionOfVersion = minVersion(version);
        if (!minVersionOfVersion || !satisfies(minVersionOfVersion, range)) {
          reportError(
            `Invalid "${peerDepKey}" peer dependency`,
            `"${version}" (in ${allowedPeerInExisting[index]}) should satisfies "${range}" from "${depPkg.name}" ${type}`,
            onlyWarnsFor.includes(peerDepKey),
          );
        }
      });
    }
  }
}
