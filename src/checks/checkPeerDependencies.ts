import semver from "semver";
import type { ReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export function checkPeerDependencies(
  pkg: PackageJson,
  reportError: ReportError,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  allowMissing: boolean,
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
      if (allowMissing) {
        continue;
      }

      const peerDependenciesMetaPeerDep = peerDependenciesMeta?.[peerDepName];
      if (peerDependenciesMetaPeerDep?.optional) {
        continue;
      }

      let additionalDetails = "";
      // satisfied by another direct dependency
      const providedDependenciesForDepName = providedDependencies.filter(
        ([depName]) => depName === peerDepName,
      );
      if (providedDependenciesForDepName.length > 0) {
        if (
          providedDependenciesForDepName.every(([, depRange]) =>
            semver.intersects(range, depRange),
          )
        ) {
          continue;
        }

        additionalDetails +=
          " (required as some dependencies have non-satisfying range too)";
      }

      reportError({
        title: `Missing "${peerDepName}" peer dependency from "${depPkg.name}" in ${type}`,
        info: `it should satisfies "${range}" and be in ${allowedPeerIn.join(" or ")}${additionalDetails}`,
        dependency: { name: peerDepName },
        onlyWarns: missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
      });
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType]![peerDepName],
      );

      versions.forEach((versionValue, index) => {
        const version = getRealVersion(versionValue);

        if (version === "*") {
          return;
        }

        const minVersionOfVersion = semver.minVersion(version);
        if (
          !minVersionOfVersion ||
          !semver.satisfies(minVersionOfVersion, range, {
            includePrerelease: true,
          })
        ) {
          reportError({
            title: "Invalid peer dependency version",
            info: `"${version}" should satisfies "${range}" from "${depPkg.name}" in ${type}`,
            dependency: {
              name: peerDepName,
              origin: allowedPeerInExisting[index],
            },
            onlyWarns: invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
          });
        }
      });
    }
  }
}
