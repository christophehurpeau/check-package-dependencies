import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyTypes,
  PackageJson,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { parseNpmAlias } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";

export function checkDuplicateDependencies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  isPkgLibrary: boolean,
  depType: DependencyTypes,
  searchIn: DependencyTypes[],
  depPkg: PackageJson,
  onlyWarnsForCheck: OnlyWarnsForCheck,
): void {
  const dependencies = depPkg[depType];
  if (!dependencies) return;

  const searchInExisting = searchIn.filter((type) => pkg[type]);

  for (const [depKey, depRange] of Object.entries(dependencies)) {
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

      if (depVersion?.value === devDepVersion!.value) {
        reportError({
          errorMessage: `Invalid "${depKey}" has same version in dependencies and devDependencies`,
          errorDetails:
            "please place it only in dependencies or use range in dependencies",
          dependency: depVersion,
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
        errorMessage: `Invalid "${depKey}" present in ${versionsIn.join(" and ")}`,
        errorDetails: "please place it only in dependencies",
      });
    } else {
      const versions = versionsIn.map((type) => pkg[type]![depKey]);

      versions.forEach((version, index) => {
        if (!version) return;
        const versionValue = version.value;
        if (depRange === "latest") return;
        if (versionValue.startsWith("file:") || depRange.startsWith("file:")) {
          return;
        }
        // https://yarnpkg.com/features/workspaces#workspace-ranges-workspace
        if (
          versionValue.startsWith("workspace:") ||
          depRange.startsWith("workspace:")
        ) {
          return;
        }

        // https://yarnpkg.com/features/patching
        if (
          versionValue.startsWith("patch:") ||
          depRange.startsWith("patch:")
        ) {
          return;
        }

        // Ignore reporting duplicate when there's a resolution for it
        if (pkg.resolutions?.[depKey]) {
          return;
        }

        const versionInType = versionsIn[index];

        const dependency = versionInType
          ? pkg[versionInType]![depKey]
          : undefined;

        const reportDuplicate = (errorDetails: string): void => {
          reportError({
            errorMessage: `Invalid duplicate dependency${dependency ? "" : `"${depKey}"`}`,
            errorDetails,
            onlyWarns: onlyWarnsForCheck.shouldWarnsFor(depKey),
            dependency,
          });
        };

        // https://docs.npmjs.com/cli/commands/npm-install#description
        // an alias installs another package under "depKey", so both sides must
        // alias the same package to be the same installed dependency at all.
        const versionAlias = parseNpmAlias(versionValue);
        const depRangeAlias = parseNpmAlias(depRange);
        if (versionAlias?.aliasedName !== depRangeAlias?.aliasedName) {
          reportDuplicate(
            `"${versions[0]!.value}" and "${depRange}" from ${depPkg.name || ""} in ${depType} install different packages`,
          );
          return;
        }

        const versionRange = versionAlias?.range ?? versionValue;
        const depRangeRange = depRangeAlias?.range ?? depRange;

        const unsupportedRange = [versionRange, depRangeRange].find(
          (range) => semver.validRange(range) === null,
        );
        if (unsupportedRange !== undefined) {
          reportError({
            errorMessage: `Unsupported range for "${depKey}"`,
            errorDetails: `"${unsupportedRange}" is not a valid semver range, "${versions[0]!.value}" cannot be compared with "${depRange}" from ${depPkg.name || ""} in ${depType}`,
            onlyWarns: onlyWarnsForCheck.shouldWarnsFor(depKey),
            dependency,
          });
          return;
        }

        if (
          semver.satisfies(versionRange, depRangeRange, {
            includePrerelease: true,
          }) ||
          semver.intersects(versionRange, depRangeRange, {
            includePrerelease: true,
          })
        ) {
          return;
        }

        reportDuplicate(
          `"${versions[0]!.value}" should satisfies "${depRange}" from ${depPkg.name || ""} in ${depType}`,
        );
      });
    }
  }
}
