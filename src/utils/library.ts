import type { ParsedPackageJson } from "./packageTypes.ts";

/**
 * Value accepted by the `library` setting/option: an explicit boolean, "auto" to
 * derive it from the package.json itself, or a list of package name patterns.
 */
export type LibrarySetting = string[] | boolean | "auto";

const renamedFromIsLibrary =
  'was renamed to "library", which also accepts "auto" (the default) and a list of package name patterns such as ["@scope/*", "!@scope/app-*"]';

export const legacyIsLibrarySettingMessage = `The "isLibrary" setting ${renamedFromIsLibrary}`;

/**
 * Guesses whether a package is a library, ie published and consumed by other
 * packages: a workspace root or a private package is not, anything else is.
 */
export function detectIsLibrary(pkg: ParsedPackageJson): boolean {
  if (pkg.workspacesPackages) return false;
  return pkg.value.private !== true;
}

interface PackageNamePattern {
  isLibrary: boolean;
  matches: (packageName: string) => boolean;
}

const parsePackageNamePattern = (pattern: string): PackageNamePattern => {
  const isLibrary = !pattern.startsWith("!");
  const namePattern = isLibrary ? pattern : pattern.slice(1);

  if (!namePattern.includes("*")) {
    return { isLibrary, matches: (packageName) => packageName === namePattern };
  }

  const regExp = new RegExp(
    `^${namePattern
      .split("*")
      .map((part) => part.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&"))
      .join(".*")}$`,
  );
  return { isLibrary, matches: (packageName) => regExp.test(packageName) };
};

/**
 * Patterns are checked in order and the last one matching wins, so exclusions are
 * written after the pattern they narrow: `["@pob/*", "!@pob/internal-*"]`. A package
 * matching no pattern is not a library.
 */
const matchesPackageNamePatterns = (
  patterns: readonly string[],
  packageName: string,
): boolean => {
  let isLibrary = false;
  for (const pattern of patterns) {
    const parsedPattern = parsePackageNamePattern(pattern);
    if (parsedPattern.matches(packageName)) {
      isLibrary = parsedPattern.isLibrary;
    }
  }
  return isLibrary;
};

export function resolveIsLibrary(
  setting: LibrarySetting | undefined,
  pkg: ParsedPackageJson,
): boolean {
  if (setting === undefined || setting === "auto") return detectIsLibrary(pkg);
  if (Array.isArray(setting)) {
    return matchesPackageNamePatterns(setting, pkg.name);
  }
  return setting;
}
