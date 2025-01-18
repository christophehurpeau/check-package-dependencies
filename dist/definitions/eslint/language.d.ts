import type { Language } from "@eslint/core";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { ParsedPackageJson } from "../utils/packageTypes.ts";
export interface PackageJsonAst {
    type: "Package";
    parsedPkgJson: ParsedPackageJson;
    getDependencyPackageJson: GetDependencyPackageJson;
    loc: {
        line: number;
        column: number;
    };
}
export declare const PackageJSONLanguage: Language;
//# sourceMappingURL=language.d.ts.map