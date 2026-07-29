import semver from "semver";
import semverUtils from "semver-utils";
import type { ReportError } from "../reporting/ReportError.ts";
import type {
  DependencyTypes,
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";

export function checkDependencyMinRangeSatisfies(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  pkg: ParsedPackageJson,
  dependencyType2: DependencyTypes,
): void {
  if (!pkg[dependencyType2]) return;
  if (!dependencyValue) return;

  const range1 = getRealVersion(dependencyValue.value);
  if (range1 === "*") return;

  const depRange2 = pkg[dependencyType2][dependencyValue.name];
  if (!depRange2) return;

  const range2 = getRealVersion(depRange2.value);
  if (range2 === "*") return;

  const minDepRange1 = semver.minVersion(range1)?.version || range1;

  if (
    !semver.satisfies(minDepRange1, range2, {
      includePrerelease: true,
    })
  ) {
    const depRange1Parsed = semverUtils.parseRange(range1);
    reportError({
      errorMessage: `Invalid "${dependencyValue.value}" in "${dependencyValue.fieldName}"`,
      errorDetails: `"${dependencyValue.value}" should satisfies "${depRange2.value}" from "${dependencyType2}"`,
      dependency: dependencyValue,
      errorTarget: "dependencyValue",
      fixTo:
        (depRange1Parsed[0]?.operator || "") +
        (semver.minVersion(range2)?.version || range2),
    });
  }
}
