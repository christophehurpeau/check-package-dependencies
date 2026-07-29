import type { ParsedPackageJson } from "./packageTypes.ts";
/**
 * Value accepted by the `library` setting/option: an explicit boolean, "auto" to
 * derive it from the package.json itself, or a list of package name patterns.
 */
export type LibrarySetting = string[] | boolean | "auto";
export declare const legacyIsLibrarySettingMessage = "The \"isLibrary\" setting was renamed to \"library\", which also accepts \"auto\" (the default) and a list of package name patterns such as [\"@scope/*\", \"!@scope/app-*\"]";
/**
 * Guesses whether a package is a library, ie published and consumed by other
 * packages: a workspace root or a private package is not, anything else is.
 */
export declare function detectIsLibrary(pkg: ParsedPackageJson): boolean;
export declare function resolveIsLibrary(setting: LibrarySetting | undefined, pkg: ParsedPackageJson): boolean;
//# sourceMappingURL=library.d.ts.map