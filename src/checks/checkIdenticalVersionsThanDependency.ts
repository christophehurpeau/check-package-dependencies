import { createReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export function checkIdenticalVersionsThanDependency(
  pkg: PackageJson,
  pkgPathName: string,
  type: DependencyTypes,
  depKeys: string[],
  depPkg: PackageJson,
  dependencies: PackageJson[DependencyTypes] = {},
  onlyWarnsForCheck?: OnlyWarnsForCheck,
  customCreateReportError = createReportError,
): void {
  const pkgDependencies = pkg[type] || {};
  const reportError = customCreateReportError(
    `Same Versions than ${depPkg.name}`,
    pkgPathName,
  );

  depKeys.forEach((depKey) => {
    const version = dependencies[depKey];
    if (!version) {
      reportError({
        title: `Unexpected missing dependency "${depKey}" in "${depPkg.name}"`,
        dependency: { name: depKey, origin: type },
      });
      return;
    }

    if (version.startsWith("^") || version.startsWith("~")) {
      reportError({
        title: `Unexpected range dependency "${depKey}" in "${depPkg.name}"`,
        info: "perhaps use checkSatisfiesVersionsFromDependency() instead",
        dependency: { name: depKey, origin: type },
      });
      return;
    }

    const value = pkgDependencies[depKey];

    if (!value) {
      reportError({
        title: `Missing "${depKey}"`,
        info: `expecting to be "${version}"`,
        dependency: { name: depKey, origin: type },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
    }

    if (value !== version) {
      reportError({
        title: `Invalid "${value}"`,
        info: `expecting "${value}" to be "${version}" from "${depPkg.name}"`,
        dependency: { name: depKey, origin: type },
        onlyWarns: onlyWarnsForCheck?.shouldWarnsFor(depKey),
      });
    }
  });
}
