import type { Commented } from "./comments.ts";
/** a dependency name to only warn for, optionally with the reason the exception exists */
export type OnlyWarnsForEntry = string | (Commented & {
    name: string;
});
export type OnlyWarnsFor = OnlyWarnsForEntry[];
export type OnlyWarnsForDependencyMapping = Record<string | "*", OnlyWarnsFor | undefined>;
export type OnlyWarnsForOptionalDependencyMapping = OnlyWarnsFor | OnlyWarnsForDependencyMapping | undefined;
export interface OnlyWarnsForCheck {
    configName: string;
    getNotWarnedFor: () => string[];
    getCommentFor: (dependencyName: string) => string | undefined;
    shouldWarnsFor: (dependencyName: string) => boolean;
}
export interface OnlyWarnsForMappingCheck {
    configName: string;
    getNotWarnedFor: () => Record<string, string[]>;
    createFor: (dependencyName: string) => OnlyWarnsForCheck;
}
export declare const createOnlyWarnsForArrayCheck: (configName: string, onlyWarnsFor?: OnlyWarnsFor) => OnlyWarnsForCheck;
export declare const createOnlyWarnsForMappingCheck: (configName: string, onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping) => OnlyWarnsForMappingCheck;
/**
 * The "onlyWarns" and "comment" details of an error downgraded to a warning by
 * "onlyWarnsFor", the comment being the explanation of the matched entry.
 */
export declare const warnDetails: (onlyWarnsForCheck: OnlyWarnsForCheck | undefined, dependencyName: string) => Commented & {
    onlyWarns: boolean | undefined;
};
//# sourceMappingURL=warnForUtils.d.ts.map