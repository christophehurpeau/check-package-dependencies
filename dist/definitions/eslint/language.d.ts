import type { Language } from "@eslint/core";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyTypes, DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
/**
 * The namespace the plugin is meant to be registered under. Declared as the plugin's
 * `meta.namespace` so eslint still resolves {@link packageJsonLanguageId} when a config
 * registers the plugin under another key.
 */
export declare const pluginNamespace = "check-package-dependencies";
export declare const packageJsonLanguageName = "package-json";
/** the `language` a config has to set to lint `package.json` files with this plugin */
export declare const packageJsonLanguageId = "check-package-dependencies/package-json";
export interface PackageJsonAst {
    type: "Package";
    parsedPkgJson: ParsedPackageJson;
    getDependencyPackageJson: GetDependencyPackageJson;
    loc: {
        line: number;
        column: number;
    };
    range: [number, number];
    children: DependencyValueAst[];
    value: string;
}
export interface DependencyValueAst {
    type: "DependencyValue";
    dependencyType: DependencyTypes;
    parsedPkgJson: ParsedPackageJson;
    getDependencyPackageJson: GetDependencyPackageJson;
    dependencyValue: DependencyValue | undefined;
    loc: {
        line: number;
        column: number;
    };
    range: [number, number];
    value: string;
}
export declare const PackageJSONLanguage: Language;
//# sourceMappingURL=language.d.ts.map