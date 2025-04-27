import type { Rule } from "eslint";
import type { ReportError } from "../../reporting/ReportError.ts";
import type { GetDependencyPackageJson } from "../../utils/createGetDependencyPackageJson.ts";
import type { DependencyValue, ParsedPackageJson } from "../../utils/packageTypes.ts";
import type { OnlyWarnsFor, OnlyWarnsForCheck, OnlyWarnsForMappingCheck } from "../../utils/warnForUtils.ts";
export declare const onlyWarnsForArraySchema: {
    readonly type: "array";
    readonly items: {
        readonly type: "string";
    };
};
export declare const onlyWarnsForMappingSchema: {
    readonly type: "object";
    readonly patternProperties: {
        readonly "^.*$": {
            readonly type: "array";
            readonly items: {
                readonly type: "string";
            };
        };
    };
};
interface CheckPackageDependenciesSettings {
    isLibrary?: boolean;
}
type CheckFn<RuleOptions, Node, T = Record<never, never>> = (params: T & {
    node: Node;
    pkg: ParsedPackageJson;
    reportError: ReportError;
    getDependencyPackageJson: GetDependencyPackageJson;
    settings: CheckPackageDependenciesSettings;
    ruleOptions: RuleOptions;
    onlyWarnsForCheck: OnlyWarnsForCheck;
    onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck;
}) => void;
export declare function createPackageRule<RuleOptions extends {
    onlyWarnsFor?: OnlyWarnsFor;
}>(ruleName: string, schema: NonNullable<NonNullable<Rule.RuleModule["meta"]>["schema"]>, { checkPackage, checkDependencyValue, }: {
    checkPackage?: CheckFn<RuleOptions, ParsedPackageJson, {
        loadWorkspacePackageJsons: () => ParsedPackageJson[];
        checkOnlyWarnsForArray: (onlyWarnsForCheck: OnlyWarnsForCheck) => void;
        checkOnlyWarnsForMapping: (onlyWarnsForMappingCheck: OnlyWarnsForMappingCheck) => void;
    }>;
    checkDependencyValue?: CheckFn<RuleOptions, DependencyValue>;
}): Record<string, Rule.RuleModule>;
export {};
//# sourceMappingURL=createPackageRule.d.ts.map