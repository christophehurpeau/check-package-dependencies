import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import { fromDependency } from "../reporting/cliErrorReporting.ts";
import type {
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export function checkPeerDependencies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
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
        errorMessage: `Missing "${peerDepName}" peer dependency ${fromDependency(depPkg, type)}`,
        errorDetails: `it should satisfies "${range}" and be in ${allowedPeerIn.join(" or ")}${additionalDetails}`,
        dependency: { name: peerDepName },
        onlyWarns: missingOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
      });
    } else {
      const versions = versionsIn.map(
        (versionsInType) => pkg[versionsInType]![peerDepName]!,
      );

      versions.forEach(({ value: versionValue }, index) => {
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
            errorMessage: "Invalid peer dependency version",
            errorDetails: `"${version}" should satisfies "${range}" ${fromDependency(depPkg, type)}`,
            dependency: pkg[allowedPeerInExisting[index]]![peerDepName]!,
            onlyWarns: invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
          });
        }
      });
    }
  }
}
