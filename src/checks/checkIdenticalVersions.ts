import type { ReportError } from "../reporting/ReportError.ts";
import type { Commented } from "../utils/comments.ts";
import { omitComment } from "../utils/comments.ts";
import { getKeys } from "../utils/object.ts";
import type {
  DependencyTypes,
  ParsedPackageJson,
} from "../utils/packageTypes.ts";
import type { OnlyWarnsForCheck } from "../utils/warnForUtils.ts";
import { warnDetails } from "../utils/warnForUtils.ts";

/**
 * The dependencies to keep identical to the reference dependency: the names to look up in
 * the same field as the reference dependency, or the names to look up per field. Only the
 * latter can carry the comment explaining what the entry is for.
 */
export type IdenticalVersionsDepConfig =
  | string[]
  | (Commented & Partial<Record<DependencyTypes, string[]>>);

export function checkIdenticalVersions(
  reportError: ReportError,
  pkg: ParsedPackageJson,
  type: DependencyTypes,
  deps: Record<string, IdenticalVersionsDepConfig>,
  { onlyWarnsForCheck }: { onlyWarnsForCheck?: OnlyWarnsForCheck } = {},
): void {
  const pkgDependencies = pkg[type] || {};

  getKeys(deps).forEach((depKey) => {
    const depConfigArrayOrObject = deps[depKey];

    if (!depConfigArrayOrObject) {
      throw new Error(`depConfig is undefined for ${depKey}`);
    }

    const isArrayConfig = Array.isArray(depConfigArrayOrObject);
    const comment = isArrayConfig ? undefined : depConfigArrayOrObject.comment;
    // "comment" is not a dependency type, it must not be iterated as one
    const depConfig = isArrayConfig
      ? { [type]: depConfigArrayOrObject }
      : omitComment(depConfigArrayOrObject);

    const version = pkgDependencies[depKey]?.value;
    if (!version) {
      reportError({
        errorMessage: `Unexpected missing ${type}`,
        errorDetails: `missing "${depKey}"`,
        ...(comment !== undefined && { comment }),
      });
      return;
    }

    getKeys(depConfig).forEach((depKeyType) => {
      const pkgDependenciesType = pkg[depKeyType] || {};
      depConfig[depKeyType]?.forEach((depKeyIdentical) => {
        const depValue = pkgDependenciesType[depKeyIdentical];
        const value = depValue?.value;
        if (!value) {
          reportError({
            errorMessage: `Missing "${depKeyIdentical}" in "${depKeyType}"`,
            errorDetails: `it should be "${version}" identical to "${depKey}" in "${type}"`,
            dependency: { name: depKeyIdentical, fieldName: depKeyType },
            ...warnDetails(onlyWarnsForCheck, depKey),
            ...(comment !== undefined && { comment }),
          });
          return;
        }

        if (value !== version) {
          reportError({
            errorMessage: `Invalid "${depKeyIdentical}"`,
            errorDetails: `expecting "${value}" to be "${version}" identical to "${depKey}" in "${type}"`,
            dependency: depValue,
            ...warnDetails(onlyWarnsForCheck, depKey),
            ...(comment !== undefined && { comment }),
            fixTo: version,
          });
        }
      });
    });
  });
}
