export type OnlyWarnsFor = string[];
export type OnlyWarnsForDependencyMapping = Record<string | "*", OnlyWarnsFor | undefined>;
export type OnlyWarnsForOptionalDependencyMapping = OnlyWarnsFor | OnlyWarnsForDependencyMapping | undefined;
export interface OnlyWarnsForCheck {
    configName: string;
    getNotWarnedFor: () => string[];
    shouldWarnsFor: (dependencyName: string) => boolean;
}
export interface OnlyWarnsForMappingCheck {
    configName: string;
    getNotWarnedFor: () => Record<string, string[]>;
    createFor: (dependencyName: string) => OnlyWarnsForCheck;
}
export declare const createOnlyWarnsForArrayCheck: (configName: string, onlyWarnsFor?: OnlyWarnsFor) => OnlyWarnsForCheck;
export declare const createOnlyWarnsForMappingCheck: (configName: string, onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping) => OnlyWarnsForMappingCheck;
//# sourceMappingURL=warnForUtils.d.ts.map