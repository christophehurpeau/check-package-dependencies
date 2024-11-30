import semver from "semver";
import type { ReportError } from "../utils/createReportError.ts";
import type { DependencyTypes, PackageJson } from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export function checkDuplicateDependencies(
  reportError: ReportError,
  pkg: PackageJson,
  isPkgLibrary: boolean,
  depType: DependencyTypes,
  searchIn: DependencyTypes[],
  depPkg: PackageJson,
  onlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const dependencies = depPkg[depType];
  if (!dependencies) return;

  const searchInExisting = searchIn.filter((type) => pkg[type]);

  for (const [depKey, range] of Object.entries(dependencies)) {
    const versionsIn = searchInExisting.filter((type) => pkg[type]![depKey]);

    let allowDuplicated = false;
    if (
      versionsIn.length === 2 &&
      isPkgLibrary &&
      versionsIn.includes("dependencies") &&
      versionsIn.includes("devDependencies")
    ) {
      const depVersion = pkg.dependencies![depKey];
      const devDepVersion = pkg.devDependencies![depKey];

      if (depVersion && depVersion === devDepVersion) {
        reportError({
          title: `Invalid "${depKey}" has same version in dependencies and devDependencies`,
          info: "please place it only in dependencies or use range in dependencies",
        });
        continue;
      }
      allowDuplicated = true;
    }

    if (
      versionsIn.length > 2 ||
      (versionsIn.length === 2 && !allowDuplicated)
    ) {
      reportError({
        title: `Invalid "${depKey}" present in ${versionsIn.join(" and ")}`,
        info: "please place it only in dependencies",
      });
    } else {
      const versions = versionsIn.map((type) => pkg[type]![depKey]);

      versions.forEach((version, index) => {
        if (version.startsWith("file:") || range.startsWith("file:")) return;
        // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
        if (
          version.startsWith("workspace:") ||
          range.startsWith("workspace:")
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

        reportError({
          title: "Invalid duplicate dependency",
          info: `"${versions[0]}" should satisfies "${range}" from ${depPkg.name} in ${depType}`,
          onlyWarns: onlyWarnsForCheck.shouldWarnsFor(depKey),
          dependency: { name: depKey, origin: versionInType },
        });
      });
    }
  }
}
