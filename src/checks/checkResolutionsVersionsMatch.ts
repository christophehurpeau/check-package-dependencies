import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";

export function checkResolutionVersionMatch(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  resolutionValue: DependencyValue,
  { tryToAutoFix }: CheckResolutionsVersionsMatchOptions = {},
): void {
  let depName = resolutionValue.name;
  let resolutionDepVersion = resolutionValue.value;
  if (!resolutionDepVersion) return;
  if (resolutionDepVersion.startsWith("patch:")) {
    const matchResolutionInKey = /^(.+)@npm:(.+)$/.exec(depName);
    if (matchResolutionInKey?.[1] && matchResolutionInKey[2]) {
      depName = matchResolutionInKey[1];
      resolutionDepVersion = matchResolutionInKey[2];
    }
  }
  (["dependencies", "devDependencies"] as const).forEach((depType) => {
    const range = pkg[depType]?.[depName];

    if (!range) return;

    if (
      !semver.satisfies(resolutionDepVersion, range.value, {
        includePrerelease: true,
      })
    ) {
      if (tryToAutoFix) {
        range.changeValue(resolutionDepVersion);
      } else {
        reportError({
          errorMessage: `Invalid "${range.value}"`,
          errorDetails: `expecting "${range.value}" be "${resolutionDepVersion}" from resolutions`,
          errorTarget: "dependencyValue",
          dependency: range,
          // don't autofix because it's probably a mistake either in resolution or in the other dependency and we can't know which one is the right one
          suggestions: [
            [
              resolutionValue,
              range.value,
              `Fix resolutions's value to "${range.value}"`,
            ],
            [
              range,
              resolutionDepVersion,
              `Fix this value to resolutions's value "${resolutionDepVersion}"`,
            ],
          ],
        });
      }
    }
  });
}

export interface CheckResolutionsVersionsMatchOptions {
  tryToAutoFix?: boolean;
}

export function checkResolutionsVersionsMatch(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  { tryToAutoFix }: CheckResolutionsVersionsMatchOptions = {},
): void {
  const pkgResolutions = pkg.resolutions || {};
  Object.values(pkgResolutions).forEach((resolutionValue) => {
    checkResolutionVersionMatch(reportError, pkg, resolutionValue!, {
      tryToAutoFix,
    });
  });
}
