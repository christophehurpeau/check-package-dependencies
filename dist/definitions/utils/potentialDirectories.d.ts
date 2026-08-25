/**
 * How a `workspaces` glob matching a directory that holds no `package.json` is reported:
 * silenced, logged as a warning, or reported as a lint error.
 */
export type PotentialDirectoriesSetting = "error" | "off" | "warn";
export declare const defaultPotentialDirectoriesSetting: PotentialDirectoriesSetting;
export declare const expectedPotentialDirectoriesSettings = "\"off\", \"warn\" or \"error\"";
export declare function isPotentialDirectoriesSetting(value: unknown): value is PotentialDirectoriesSetting;
/** the configured value, falling back to the default for an invalid one */
export declare function resolvePotentialDirectoriesSetting(value: unknown): PotentialDirectoriesSetting;
export declare const invalidPotentialDirectoriesSettingMessage: (value: unknown) => string;
//# sourceMappingURL=potentialDirectories.d.ts.map