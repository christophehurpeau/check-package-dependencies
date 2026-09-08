import type { Location } from "../../utils/packageTypes.ts";
/** an error a rule downgraded to a warning through its "onlyWarnsFor" option */
export interface OnlyWarnsForWarning {
    message: string;
    /** the rule that downgraded the error, which is not the rule reporting the warning */
    ruleName: string;
    loc: Location | undefined;
}
export declare function addOnlyWarnsForWarning(packageAst: object, warning: OnlyWarnsForWarning): void;
export declare function getOnlyWarnsForWarnings(packageAst: object): readonly OnlyWarnsForWarning[];
//# sourceMappingURL=onlyWarnsForWarnings.d.ts.map