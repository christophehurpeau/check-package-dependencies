import semver from "semver";
import semverUtils from "semver-utils";
import type { ReportError } from "../reporting/ReportError.ts";
import { getEntries } from "../utils/object.ts";
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
      autoFixable: true,
      errorTarget: "dependencyValue",
      fixTo:
        (depRange1Parsed[0]?.operator || "") +
        (semver.minVersion(range2)?.version || range2),
    });
  }
}

export interface CheckMinRangeSatisfiesOptions {
  tryToAutoFix?: boolean;
}

export function checkMinRangeSatisfies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type1: DependencyTypes = "dependencies",
  type2: DependencyTypes = "devDependencies",
  { tryToAutoFix = false }: CheckMinRangeSatisfiesOptions = {},
): void {
  const dependencies1 = pkg[type1];
  const dependencies2 = pkg[type2];

  if (!dependencies1 || !dependencies2) {
    return;
  }

  for (const [depName, depRange1] of getEntries(dependencies1)) {
    if (!depRange1) continue;

    const range1 = getRealVersion(depRange1.value);
    if (range1 === "*") continue;

    const depRange2 = dependencies2[depName];
    if (!depRange2) continue;

    const range2 = getRealVersion(depRange2.value);
    if (range2 === "*") continue;

    const minDepRange1 = semver.minVersion(range1)?.version || range1;

    if (
      !semver.satisfies(minDepRange1, range2, {
        includePrerelease: true,
      })
    ) {
      if (tryToAutoFix) {
        const depRange1Parsed = semverUtils.parseRange(range1);
        depRange1.changeValue(
          (depRange1Parsed[0]?.operator || "") +
            (semver.minVersion(range2)?.version || range2),
        );
      } else {
        reportError({
          errorMessage: `Invalid "${depRange1.value}" in "${type1}"`,
          errorDetails: `"${depRange1.value}" should satisfies "${depRange2.value}" from "${type2}"`,
          dependency: depRange1,
          autoFixable: true,
        });
      }
    }
  }
}
