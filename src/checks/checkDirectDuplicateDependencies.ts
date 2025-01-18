import type { ReportError } from "../reporting/ReportError.ts";
import { reportNotWarnedForMapping } from "../reporting/cliErrorReporting.ts";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import { getKeys } from "../utils/object.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForMappingCheck } from "../utils/warnForUtils.ts";
import { checkDuplicateDependencies } from "./checkDuplicateDependencies.ts";

export function checkDirectDuplicateDependencies(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  isPackageALibrary: boolean,
  depType: DependencyTypes,
  getDependencyPackageJson: GetDependencyPackageJson,
  onlyWarnsForCheck: OnlyWarnsForMappingCheck,
): void {
  const checks: {
    type: DependencyTypes;
    searchIn: DependencyTypes[];
  }[] = [
    {
      type: "devDependencies",
      searchIn: ["devDependencies", "dependencies"],
    },
    { type: "dependencies", searchIn: ["devDependencies", "dependencies"] },
  ];

  checks.forEach(({ type, searchIn }) => {
    const dependencies = pkg[type];

    if (!dependencies) return;
    for (const depName of getKeys(dependencies)) {
      const [depPkg] = getDependencyPackageJson(depName);
      checkDuplicateDependencies(
        reportError,
        pkg,
        isPackageALibrary,
        depType,
        searchIn,
        depPkg,
        onlyWarnsForCheck.createFor(depName),
      );
    }
  });

  reportNotWarnedForMapping(reportError, onlyWarnsForCheck);
}
