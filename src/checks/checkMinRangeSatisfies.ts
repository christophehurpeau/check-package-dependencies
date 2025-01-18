import semver from "semver";
import semverUtils from "semver-utils";
import type { ReportError } from "../reporting/ReportError.ts";
import { getEntries } from "../utils/object.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";

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
    if (!depRange1 || depRange1.value === "*") continue;

    const depRange2 = dependencies2[depName];
    if (!depRange2) continue;

    const minDepRange1 =
      semver.minVersion(depRange1.value)?.version || depRange1.value;

    if (
      !semver.satisfies(minDepRange1, depRange2.value, {
        includePrerelease: true,
      })
    ) {
      if (tryToAutoFix) {
        const depRange1Parsed = semverUtils.parseRange(depRange1.value);
        depRange1.changeValue(
          (depRange1Parsed[0]?.operator || "") +
            (semver.minVersion(depRange2.value)?.version || depRange2.value),
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
