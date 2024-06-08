import { getEntries } from "./object";

export type OnlyWarnsFor = string[];
// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
export type OnlyWarnsForDependencyMapping = Record<string | "*", OnlyWarnsFor>;
export type OnlyWarnsForOptionalDependencyMapping =
  | OnlyWarnsFor
  | OnlyWarnsForDependencyMapping
  | undefined;

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

export const createOnlyWarnsForArrayCheck = (
  configName: string,
  onlyWarnsFor: OnlyWarnsFor = [],
): OnlyWarnsForCheck => {
  const notWarnedFor = new Set(onlyWarnsFor);
  return {
    configName,
    getNotWarnedFor: () => [...notWarnedFor],
    shouldWarnsFor(dependencyName) {
      if (onlyWarnsFor.includes(dependencyName)) {
        notWarnedFor.delete(dependencyName);
        return true;
      }
      return false;
    },
  };
};

const isMapping = (
  onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping,
): onlyWarnsFor is OnlyWarnsForDependencyMapping => {
  return typeof onlyWarnsFor === "object" && !Array.isArray(onlyWarnsFor);
};

export const createOnlyWarnsForMappingCheck = (
  configName: string,
  onlyWarnsFor: OnlyWarnsForOptionalDependencyMapping,
): OnlyWarnsForMappingCheck => {
  if (isMapping(onlyWarnsFor)) {
    const notWarnedFor = Object.fromEntries(
      getEntries(onlyWarnsFor).map(([entryKey, entryValue]) => [
        entryKey,
        new Set(entryValue),
      ]),
    );
    return {
      configName,
      getNotWarnedFor: () =>
        Object.fromEntries(
          getEntries(notWarnedFor)
            .filter(([key, set]) => set.size > 0)
            .map(([key, set]) => [key, [...set]]),
        ),
      createFor(dependencyNameLevel1) {
        return {
          configName,
          getNotWarnedFor() {
            throw new Error("Invalid call to getNotWarnedFor()");
          },
          shouldWarnsFor(dependencyName) {
            if (onlyWarnsFor["*"]?.includes(dependencyName)) {
              notWarnedFor["*"].delete(dependencyName);
              return true;
            }
            if (onlyWarnsFor[dependencyNameLevel1]?.includes(dependencyName)) {
              notWarnedFor[dependencyNameLevel1].delete(dependencyName);
              return true;
            }
            return false;
          },
        };
      },
    };
  }

  const arrayOnlyWarnsForCheck = createOnlyWarnsForArrayCheck(
    configName,
    onlyWarnsFor,
  );
  return {
    configName,
    getNotWarnedFor: (): Record<string, string[]> => {
      const notWarnedFor = arrayOnlyWarnsForCheck.getNotWarnedFor();
      if (notWarnedFor.length > 0) {
        return { "*": notWarnedFor };
      }
      return {};
    },
    createFor() {
      return {
        configName,
        getNotWarnedFor() {
          throw new Error("Invalid call to getNotWarnedFor()");
        },
        shouldWarnsFor(dependencyName) {
          return arrayOnlyWarnsForCheck.shouldWarnsFor(dependencyName);
        },
      };
    },
  };
};
