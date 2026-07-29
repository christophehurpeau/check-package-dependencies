import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";

export function checkResolutionVersionMatch(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  resolutionValue: DependencyValue,
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

    const realRange = getRealVersion(range.value);
    // "workspace:*" resolves to the local package's own version; nothing to match.
    if (realRange === "*") return;

    if (
      !semver.satisfies(resolutionDepVersion, realRange, {
        includePrerelease: true,
      })
    ) {
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
  });
}
