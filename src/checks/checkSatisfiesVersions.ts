import semver from "semver";
import type { ReportError } from "../reporting/ReportError.ts";
import type { CommentedRange } from "../utils/comments.ts";
import { resolveCommentedRange } from "../utils/comments.ts";
import type {
  DependencyTypes,
  DependencyValue,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import { getRealVersion } from "../utils/semverUtils.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { warnDetails } from "../utils/warnForUtils.ts";

export function isVersionSatisfiesRange(
  version: string,
  range: string,
): boolean {
  const realVersion = getRealVersion(version);
  // "workspace:*" (and "workspace:~"/"workspace:^") resolves to the local
  // package's own version; there is nothing to range-check, treat as satisfied.
  if (realVersion === "*") return true;

  const minVersionOfVersion = semver.minVersion(realVersion);
  return (
    !!minVersionOfVersion &&
    semver.satisfies(minVersionOfVersion, getRealVersion(range), {
      includePrerelease: true,
    })
  );
}

export function checkSatisfiesVersion(
  reportError: ReportError,
  dependencyValue: DependencyValue,
  rangeConfig: CommentedRange,
  onlyWarnsForCheck?: OnlyWarnsForCheck,
): void {
  const { range, comment } = resolveCommentedRange(rangeConfig);

  if (!isVersionSatisfiesRange(dependencyValue.value, range)) {
    const maxSatisfying = semver.maxSatisfying(
      [dependencyValue.value, range],
      range,
      { includePrerelease: true },
    );

    reportError({
      errorMessage: "Invalid",
      errorDetails: `"${dependencyValue.value}" should satisfies "${range}"`,
      dependency: dependencyValue,
      ...warnDetails(onlyWarnsForCheck, dependencyValue.name),
      ...(comment !== undefined && { comment }),
      ...(maxSatisfying && {
        suggestions: [
          [dependencyValue, maxSatisfying, `Use version ${maxSatisfying}`],
        ],
      }),
    });
  }
}

export function checkMissingSatisfiesVersions(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  acceptedTypes: DependencyTypes | DependencyTypes[],
  dependenciesRanges: Record<string, CommentedRange>,
  onlyWarnsForCheck?: OnlyWarnsForCheck,
): void {
  const types = Array.isArray(acceptedTypes) ? acceptedTypes : [acceptedTypes];

  Object.entries(dependenciesRanges).forEach(([name, rangeConfig]) => {
    const { range, comment } = resolveCommentedRange(rangeConfig);
    let found = false;
    for (const type of types) {
      const pkgDependency = pkg.value[type]?.[name];
      if (pkgDependency) {
        found = true;
        break;
      }
    }

    if (!found) {
      reportError({
        errorMessage: `Missing "${name}" in "${types.join('" or "')}"`,
        errorDetails: `should satisfies "${range}"`,
        dependency:
          types.length === 1 ? { name, fieldName: types[0] } : { name },
        ...warnDetails(onlyWarnsForCheck, name),
        ...(comment !== undefined && { comment }),
      });
    }
  });
}
