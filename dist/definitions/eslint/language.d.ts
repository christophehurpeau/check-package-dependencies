import type { Language } from "@eslint/core";
import type { GetDependencyPackageJson } from "../utils/createGetDependencyPackageJson.ts";
import type { DependencyTypes, DependencyValue, ParsedPackageJson } from "../utils/packageTypes.ts";
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