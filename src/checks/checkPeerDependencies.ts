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

export function checkSatisfiesPeerDependency(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  peerDepName: string,
  range: string,
  depPkg: PackageJson,
  invalidOnlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const versions = allowedPeerIn.map(
    (versionsInType) => pkg[versionsInType]?.[peerDepName],
  );

  versions.forEach((versionV, index) => {
    if (!versionV) {
      return;
    }
    const version = getRealVersion(versionV.value);

    if (version === "*" || version.startsWith("patch:")) {
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
        dependency: allowedPeerIn[index]
          ? (pkg[allowedPeerIn[index]]?.[peerDepName] ?? undefined)
          : undefined,
        onlyWarns: invalidOnlyWarnsForCheck.shouldWarnsFor(peerDepName),
      });
    }
  });
}

export function checkPeerDependencies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type: DependencyTypes,
  allowedPeerIn: DependencyTypes[],
  allowMissing: boolean,
  providedDependencies: [
    depName: string,
    depVersion: string,
    depPkgName: string,
  ][],
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
          if (process.env.REPORT_PROVIDED_PEER_DEPENDENCIES) {
            reportError({
              errorMessage: `Missing "${peerDepName}" peer dependency ${fromDependency(depPkg, type)}`,
              errorDetails: `but it is provided by ${providedDependenciesForDepName.map(([depName, depRange, depPkgName]) => depPkgName).join(", ")}`,
              dependency: { name: peerDepName },
              onlyWarns:
                process.env.REPORT_PROVIDED_PEER_DEPENDENCIES === "warn",
            });
          }
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
      checkSatisfiesPeerDependency(
        reportError,
        pkg,
        type,
        allowedPeerInExisting,
        peerDepName,
        range,
        depPkg,
        invalidOnlyWarnsForCheck,
      );
    }
  }
}
