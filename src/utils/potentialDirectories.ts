/**
 * How a `workspaces` glob matching a directory that holds no `package.json` is reported:
 * silenced, logged as a warning, or reported as a lint error.
 */
export type PotentialDirectoriesSetting = "error" | "off" | "warn";

export const defaultPotentialDirectoriesSetting: PotentialDirectoriesSetting =
  "warn";

const potentialDirectoriesSettings = new Set<string>(["off", "warn", "error"]);

export const expectedPotentialDirectoriesSettings = `"off", "warn" or "error"`;

export function isPotentialDirectoriesSetting(
  value: unknown,
): value is PotentialDirectoriesSetting {
  return typeof value === "string" && potentialDirectoriesSettings.has(value);
}

/** the configured value, falling back to the default for an invalid one */
export function resolvePotentialDirectoriesSetting(
  value: unknown,
): PotentialDirectoriesSetting {
  return isPotentialDirectoriesSetting(value)
    ? value
    : defaultPotentialDirectoriesSetting;
}

export const invalidPotentialDirectoriesSettingMessage = (
  value: unknown,
): string =>
  `Invalid "potentialDirectories" setting: received ${JSON.stringify(value)}, expected ${expectedPotentialDirectoriesSettings}.`;
